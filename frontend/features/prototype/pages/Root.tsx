// @ts-nocheck
"use client";

import { Outlet, useNavigate, useLocation } from "@/features/prototype/router-compat";
import { TopRedHeader } from "@/features/prototype/components/TopRedHeader";
import HeaderFreeUser from "@/features/prototype/imports/HeaderFreeUser";
import { Footer } from "@/features/prototype/components/Footer";
import { ProtectedContent } from "@/features/prototype/components/ProtectedContent";
import { LoginModal } from "@/features/prototype/components/LoginModal";
import { AdsenseScript } from "@/components/adsense/AdsenseScript";
import { AdsenseConfigProvider } from "@/components/adsense/AdsenseConfigContext";
import { AdSlotProvider } from "@/components/ads/AdSlotProvider";
import { FlashInfoBar } from "@/features/news/components/FlashInfoBar";
import { NavigationProgressBar } from "@/components/navigation/NavigationProgressBar";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { emitSuccessToast } from "@/features/prototype/lib/client-toast";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { useEffect, useState } from "react";

type RootProps = {
  children?: React.ReactNode;
  siteLogoUrl?: string;
};

export default function Root({ children, siteLogoUrl }: RootProps) {
  const { needsPlanSelection, isLoggedIn, user } = useAuth();
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationBannerMessage, setVerificationBannerMessage] = useState("");
  const [hasCheckedBusinessProfile, setHasCheckedBusinessProfile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckoutReturnPage = location.pathname === "/checkout/retour";
  const isHomePage = location.pathname === "/";
  const siteLayoutWidthClass = "max-w-[1440px]";
  const pathnameSegments = location.pathname.split("/").filter(Boolean);
  const isArticleDetailPage =
    pathnameSegments.length === 2 &&
    pathnameSegments[0] === "actualites" &&
    pathnameSegments[1] !== "archives" &&
    pathnameSegments[1] !== "categorie" &&
    pathnameSegments[1] !== "soumettre";
  const shouldShowFlashInfoBar =
    location.pathname === "/actualites" ||
    location.pathname === "/news" ||
    location.pathname.startsWith("/category/") ||
    location.pathname.startsWith("/tag/");
  // The onboarding screen owns the account setup flow. Keeping the resend
  // action out of the global banner prevents replacing a fresh verification
  // link before the profile has been completed.
  const shouldShowVerificationBanner =
    isLoggedIn && user?.emailVerified === false && user?.onboardingCompleted !== false;
  const shouldShowBusinessActivityBanner =
    isLoggedIn &&
    hasCheckedBusinessProfile &&
    user?.planId === "business" &&
    (!user?.businessActivityCategory || user.businessActivityCategory.trim() === "");

  async function handleResendVerificationEmail() {
    if (isResendingVerification) {
      return;
    }

    setIsResendingVerification(true);
    setVerificationBannerMessage("");
    try {
      const response = await fetch("/api/auth/email-verification/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setVerificationBannerMessage(getUserFacingErrorMessage(payload?.error, "Impossible d'envoyer l'email de verification pour le moment."));
        return;
      }
      if (payload?.alreadyVerified) {
        setVerificationBannerMessage("Votre email est deja verifie.");
        return;
      }
      if (payload?.emailSent) {
        setVerificationBannerMessage("Email de verification envoye. Verifiez votre boite de reception.");
        return;
      }
      setVerificationBannerMessage("Impossible d'envoyer l'email de verification pour le moment.");
    } catch {
      setVerificationBannerMessage("Impossible d'envoyer l'email de verification pour le moment.");
    } finally {
      setIsResendingVerification(false);
    }
  }

  useEffect(() => {
    if (isCheckoutReturnPage) {
      return;
    }

    if (needsPlanSelection && location.pathname !== "/pricing" && location.pathname !== "/tarifs") {
      navigate("/tarifs", { replace: true });
    }
  }, [isCheckoutReturnPage, needsPlanSelection, location.pathname, navigate]);

  useEffect(() => {
    if (!isLoggedIn || user?.planId !== "business") {
      setHasCheckedBusinessProfile(true);
      return;
    }

    // Profile updates explicitly refresh the session; rendering must not
    // trigger an extra WordPress request on every navigation.
    setHasCheckedBusinessProfile(true);
  }, [isLoggedIn, user?.planId]);

  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const rawToast = window.sessionStorage.getItem("auth-welcome-toast");
    if (!rawToast) {
      return;
    }

    try {
      const payload = JSON.parse(rawToast) as { message?: string };
      emitSuccessToast(payload.message || "Bienvenue sur Tanyora !");
    } catch {
      emitSuccessToast("Bienvenue sur Tanyora !");
    } finally {
      window.sessionStorage.removeItem("auth-welcome-toast");
    }
  }, [isHomePage]);

  const content = children ?? <Outlet />;
  const hasPinnedAlert = shouldShowVerificationBanner || shouldShowBusinessActivityBanner;
  const stickyOffset = hasPinnedAlert
    ? "13rem"
    : isArticleDetailPage
      ? "10rem"
      : "8rem";

  if (isCheckoutReturnPage) {
    return <div className="ui-page-soft min-h-screen">{content}</div>;
  }

  return (
    <AdsenseConfigProvider>
      <AdSlotProvider>
      <div
        className="ui-page prototype-app min-h-screen flex flex-col prototype-wide-layout"
        style={{
          "--prototype-sticky-offset": stickyOffset,
        }}
      >
        <AdsenseScript />
      {shouldShowVerificationBanner || shouldShowBusinessActivityBanner ? (
        <div className="fixed left-0 right-0 top-0 z-[120] bg-[var(--brand-red)] text-white shadow-[0_10px_30px_rgba(234,40,40,0.22)]">
          <div className={`mx-auto flex ${siteLayoutWidthClass} flex-col prototype-nav`}>
            {shouldShowVerificationBanner ? (
              <div className="border-b border-white/15 px-3 py-3 md:px-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-[12px] text-white/90 md:text-[13px]">
                    Votre adresse email n&apos;est pas encore vérifiée. Vérifiez votre compte pour débloquer les actions.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void handleResendVerificationEmail();
                      }}
                      disabled={isResendingVerification}
                      className="ui-button min-h-[36px] bg-white px-3 py-1.5 text-[12px] text-[#c91f1f] hover:bg-white/90"
                    >
                      {isResendingVerification ? "Envoi..." : "Activer le compte"}
                    </button>
                    {verificationBannerMessage ? (
                      <span className="text-[11px] text-white/85">{verificationBannerMessage}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {shouldShowBusinessActivityBanner ? (
              <div className="px-3 py-3 md:px-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-[12px] text-white/90 md:text-[13px]">
                    Pour compléter votre profil Business, renseignez le champ « Catégorie d’activité » dans Mes informations, puis enregistrez vos modifications.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/profil/modifier")}
                    className="ui-button min-h-[36px] bg-white px-3 py-1.5 text-[12px] text-[#c91f1f] hover:bg-white/90"
                  >
                    Compléter mon profil
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <TopRedHeader />

      <div className="sticky top-0 z-50">
        <div className="ui-surface relative">
          <div className={`mx-auto ${siteLayoutWidthClass} prototype-nav prototype-nav-compact`}>
            <HeaderFreeUser logoUrl={siteLogoUrl} />
          </div>
          <NavigationProgressBar />
        </div>

        {shouldShowFlashInfoBar ? <FlashInfoBar /> : null}
      </div>

      <ProtectedContent>{content}</ProtectedContent>

        <Footer logoUrl={siteLogoUrl} />
        <LoginModal />
        <AssistantWidget />
      </div>
      </AdSlotProvider>
    </AdsenseConfigProvider>
  );
}
