"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/features/prototype/app/context/AuthContext";
import PrototypeTextNormalizer from "./prototype-text-normalizer";
import { AppToastHost } from "@/features/prototype/components/AppToastHost";
import { CookieConsentProvider } from "@/components/privacy/CookieConsentProvider";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import type { AppSessionUser } from "@/lib/auth/session";

const THEME_KEY = "prototype-theme";

type ProvidersProps = {
  children: React.ReactNode;
  initialUser?: AppSessionUser | null;
};

export default function Providers({ children, initialUser = null }: ProvidersProps) {
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    // Light is the public default; keep dark mode only when a visitor chose it.
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <CookieConsentProvider>
      <GoogleAnalytics />
      <AuthProvider initialUser={initialUser}>
        <PrototypeTextNormalizer />
        {children}
        <AppToastHost />
      </AuthProvider>
    </CookieConsentProvider>
  );
}
