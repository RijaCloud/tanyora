// @ts-nocheck
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_SUBSCRIPTION_PLAN_ID } from "@/config/subscription-plans";
import { sanitizeReturnTo } from "@/lib/auth/flow";
import type { AppSessionUser } from "@/lib/auth/session";
import type { SubscriptionPlanId } from "@/types/subscriptions";

type UserPlan = "visitor" | SubscriptionPlanId;
type LoginResult =
  | { status: "authenticated" }
  | {
      status: "otp_required";
      challengeId: string;
      email: string;
      expiresInSeconds: number;
      resendAvailableInSeconds?: number;
      message?: string;
    };
type OtpLoginResult = Extract<LoginResult, { status: "otp_required" }>;

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  userPlan: UserPlan;
  showLoginModal: boolean;
  showPlanModal: boolean;
  needsPlanSelection: boolean;
  userName: string;
  userEmail: string;
  user: AppSessionUser | null;
  setShowLoginModal: (show: boolean) => void;
  login: (email?: string, password?: string) => Promise<LoginResult>;
  verifyLoginOtp: (challengeId: string, code: string) => Promise<void>;
  resendLoginOtp: (challengeId: string) => Promise<OtpLoginResult>;
  signupWithEmailPassword: (email?: string, password?: string) => Promise<void>;
  loginWithGoogle: () => void;
  signupWithGoogle: () => void;
  continueWithEmail: (mode?: "login" | "signup", payload?: { email?: string; password?: string }) => void;
  logout: () => Promise<void>;
  selectPlan: (plan: SubscriptionPlanId) => void;
  refreshSession: () => Promise<AppSessionUser | null | undefined>;
}

const PLAN_STORAGE_KEY = "auth-plan";
const LOGIN_MODAL_DISMISSED_KEY = "loginModalDismissed";
const LOGIN_RETURN_TO_KEY = "login-modal-return-to";
const AUTH_WELCOME_TOAST_KEY = "auth-welcome-toast";
const PLAN_UPDATE_EVENT = "2424-plan-updated";
const AUTH_REFRESH_EVENT = "2424-auth-refresh";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

let currentUserRequest: Promise<AppSessionUser | null> | null = null;

async function fetchCurrentUser() {
  if (!currentUserRequest) {
    currentUserRequest = fetch("/api/auth/me?refresh=1", {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session refresh failed");
        }

        const data = await response.json();
        return data.user ?? null;
      })
      .finally(() => {
        currentUserRequest = null;
      });
  }

  return currentUserRequest;
}

function readStoredPlan() {
  const savedPlan = localStorage.getItem(PLAN_STORAGE_KEY) as UserPlan | null;
  if (savedPlan === "free" || savedPlan === "essentiel" || savedPlan === "business") {
    return savedPlan;
  }
  return null;
}

function shouldAutoSyncSubscription(nextUser: AppSessionUser | null) {
  if (!nextUser) {
    return false;
  }

  return nextUser.onboardingCompleted !== false;
}

function areUsersEquivalent(currentUser: AppSessionUser | null, nextUser: AppSessionUser | null) {
  if (currentUser === nextUser) {
    return true;
  }

  if (!currentUser || !nextUser) {
    return false;
  }

  return JSON.stringify(currentUser) === JSON.stringify(nextUser);
}

export function AuthProvider({ children, initialUser = null }: { children: React.ReactNode; initialUser?: AppSessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AppSessionUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [userPlan, setUserPlan] = useState<UserPlan>(initialUser?.planId || (initialUser ? DEFAULT_SUBSCRIPTION_PLAN_ID : "visitor"));
  const [showLoginModal, setShowLoginModalState] = useState(false);
  const [showPlanModal] = useState(false);
  const isLoggingOutRef = useRef(false);
  const lastInitialUserKeyRef = useRef<string | null>(JSON.stringify(initialUser ?? null));

  const applyPlan = useCallback((nextUser: AppSessionUser | null) => {
    if (!nextUser) {
      setUserPlan("visitor");
      return;
    }

    if (nextUser.planId) {
      localStorage.setItem(PLAN_STORAGE_KEY, nextUser.planId);
      setUserPlan(nextUser.planId);
      return;
    }

    localStorage.setItem(PLAN_STORAGE_KEY, DEFAULT_SUBSCRIPTION_PLAN_ID);
    setUserPlan(DEFAULT_SUBSCRIPTION_PLAN_ID);
  }, []);

  useEffect(() => {
    applyPlan(user);
  }, [applyPlan, user]);

  const refreshSession = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return;
    }

    setIsLoading(true);
    try {
      const nextUser = await fetchCurrentUser();
      setUser((currentUser) => {
        if (areUsersEquivalent(currentUser, nextUser)) {
          return currentUser;
        }
        return nextUser;
      });
      applyPlan(nextUser);
      return nextUser;
    } finally {
      setIsLoading(false);
    }
  }, [applyPlan]);

  useEffect(() => {
    const nextInitialUserKey = JSON.stringify(initialUser ?? null);
    if (nextInitialUserKey === lastInitialUserKeyRef.current) {
      return;
    }

    lastInitialUserKeyRef.current = nextInitialUserKey;

    if (isLoggingOutRef.current) {
      return;
    }

    setUser((currentUser) => {
      if (areUsersEquivalent(currentUser, initialUser)) {
        return currentUser;
      }
      return initialUser;
    });
    applyPlan(initialUser);
    setIsLoading(false);
    isLoggingOutRef.current = false;
  }, [applyPlan, initialUser]);

  useEffect(() => {
    function handlePlanSync(event: Event) {
      const nextPlan = (event as CustomEvent<{ planId?: SubscriptionPlanId }>).detail?.planId;
      if (nextPlan === "free" || nextPlan === "essentiel" || nextPlan === "business") {
        localStorage.setItem(PLAN_STORAGE_KEY, nextPlan);
        setUserPlan(nextPlan);
        return;
      }

      const savedPlan = readStoredPlan();
      if (savedPlan) {
        setUserPlan(savedPlan);
      }
    }

    function handleAuthRefresh() {
      refreshSession().catch(() => undefined);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === AUTH_REFRESH_EVENT) {
        handleAuthRefresh();
        return;
      }

      handlePlanSync(event);
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PLAN_UPDATE_EVENT, handlePlanSync as EventListener);
    window.addEventListener(AUTH_REFRESH_EVENT, handleAuthRefresh as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PLAN_UPDATE_EVENT, handlePlanSync as EventListener);
      window.removeEventListener(AUTH_REFRESH_EVENT, handleAuthRefresh as EventListener);
    };
  }, [refreshSession]);

  const setShowLoginModal = useCallback((show: boolean) => {
    if (show) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem(LOGIN_RETURN_TO_KEY, currentPath);
    }
    setShowLoginModalState(show);
  }, []);

  const login = useCallback(async (email?: string, password?: string) => {
    if (!email || !password) {
      throw new Error("Email et mot de passe obligatoires.");
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Connexion impossible.");
      }

      if (data?.otpRequired && data?.challengeId) {
        return {
          status: "otp_required" as const,
          challengeId: data.challengeId,
          email: data.email || email,
          expiresInSeconds: Number(data.expiresInSeconds || 0),
          resendAvailableInSeconds: Number(data.resendAvailableInSeconds || 0) || undefined,
          message: typeof data.message === "string" ? data.message : undefined,
        };
      }

      isLoggingOutRef.current = false;
      setUser((currentUser) => {
        const nextUser = data.user ?? null;
        if (areUsersEquivalent(currentUser, nextUser)) {
          return currentUser;
        }
        return nextUser;
      });
      applyPlan(data.user ?? null);
      sessionStorage.setItem(
        AUTH_WELCOME_TOAST_KEY,
        JSON.stringify({
          message: `Bienvenue${data?.user?.name ? `, ${data.user.name}` : ""} !`,
        }),
      );
      setShowLoginModalState(false);
      router.refresh();
      return { status: "authenticated" as const };
    } finally {
      setIsLoading(false);
    }
  }, [applyPlan, router]);

  const verifyLoginOtp = useCallback(async (challengeId: string, code: string) => {
    if (!challengeId || !code) {
      throw new Error("Code de connexion manquant.");
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ challengeId, code }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Verification du code impossible.");
      }

      isLoggingOutRef.current = false;
      setUser((currentUser) => {
        const nextUser = data.user ?? null;
        if (areUsersEquivalent(currentUser, nextUser)) {
          return currentUser;
        }
        return nextUser;
      });
      applyPlan(data.user ?? null);
      sessionStorage.setItem(
        AUTH_WELCOME_TOAST_KEY,
        JSON.stringify({
          message: `Bienvenue${data?.user?.name ? `, ${data.user.name}` : ""} !`,
        }),
      );
      setShowLoginModalState(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }, [applyPlan, router]);

  const resendLoginOtp = useCallback(async (challengeId: string) => {
    if (!challengeId) {
      throw new Error("Session de connexion introuvable.");
    }

    const response = await fetch("/api/auth/login/resend-otp", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ challengeId }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Impossible de renvoyer le code.");
    }

    return {
      status: "otp_required" as const,
      challengeId: data.challengeId,
      email: data.email || "",
      expiresInSeconds: Number(data.expiresInSeconds || 0),
      resendAvailableInSeconds: Number(data.resendAvailableInSeconds || 0) || undefined,
      message: typeof data.message === "string" ? data.message : undefined,
    };
  }, []);

  const signupWithEmailPassword = useCallback(async (email?: string, password?: string) => {
    if (!email || !password) {
      throw new Error("Email et mot de passe obligatoires.");
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Inscription impossible.");
      }

      const nextUser = data.user ?? null;
      isLoggingOutRef.current = false;
      setUser((currentUser) => {
        if (areUsersEquivalent(currentUser, nextUser)) {
          return currentUser;
        }
        return nextUser;
      });
      applyPlan(nextUser);
      setShowLoginModalState(false);

      const baseReturnTo = sessionStorage.getItem(LOGIN_RETURN_TO_KEY) || pathname || "/";
      window.location.assign(`/onboarding?method=email&returnTo=${encodeURIComponent(baseReturnTo)}`);
    } finally {
      setIsLoading(false);
    }
  }, [applyPlan, pathname]);

  const loginWithGoogle = useCallback(() => {
    const destination = sanitizeReturnTo(pathname || "/");
    window.location.assign(
      `/api/auth/google/login?intent=login&returnTo=${encodeURIComponent(destination)}&origin=${encodeURIComponent(window.location.origin)}`,
    );
  }, [pathname]);

  const signupWithGoogle = useCallback(() => {
    const fallbackReturnTo = pathname || "/";
    const destination = sanitizeReturnTo(fallbackReturnTo);
    window.location.assign(
      `/api/auth/google/login?intent=signup&returnTo=${encodeURIComponent(destination)}&origin=${encodeURIComponent(window.location.origin)}`,
    );
  }, [pathname]);

  const continueWithEmail = useCallback((mode: "login" | "signup" = "login", payload?: { email?: string; password?: string }) => {
    const baseReturnTo = sessionStorage.getItem(LOGIN_RETURN_TO_KEY) || pathname || "/";
    if (mode === "signup") {
      if (payload?.email || payload?.password) {
        sessionStorage.setItem(
          "onboarding-auth-draft",
          JSON.stringify({
            email: payload?.email || "",
            password: payload?.password || "",
          }),
        );
      }
      router.push(`/onboarding?method=email&returnTo=${encodeURIComponent(baseReturnTo)}`);
      setShowLoginModalState(false);
    }
  }, [pathname, router]);

  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;
    localStorage.removeItem(PLAN_STORAGE_KEY);
    localStorage.removeItem(LOGIN_MODAL_DISMISSED_KEY);
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    setUser(null);
    applyPlan(null);
    setShowLoginModalState(false);
    window.location.assign("/");
  }, [applyPlan]);

  const selectPlan = useCallback((plan: SubscriptionPlanId) => {
    localStorage.setItem(PLAN_STORAGE_KEY, plan);
    window.dispatchEvent(new CustomEvent(PLAN_UPDATE_EVENT, { detail: { planId: plan } }));
    setUserPlan(plan);
  }, []);

  const value = useMemo(
    () => ({
      isLoggedIn: Boolean(user),
      isLoading,
      userPlan,
      showLoginModal,
      showPlanModal,
      needsPlanSelection: false,
      userName: user?.name || user?.username || user?.email || "Mon compte",
      userEmail: user?.email || "",
      user,
      setShowLoginModal,
      login,
      verifyLoginOtp,
      resendLoginOtp,
      signupWithEmailPassword,
      loginWithGoogle,
      signupWithGoogle,
      continueWithEmail,
      logout,
      selectPlan,
      refreshSession,
    }),
    [continueWithEmail, isLoading, login, logout, refreshSession, resendLoginOtp, selectPlan, showLoginModal, showPlanModal, signupWithEmailPassword, signupWithGoogle, user, userPlan, verifyLoginOtp, loginWithGoogle, setShowLoginModal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
