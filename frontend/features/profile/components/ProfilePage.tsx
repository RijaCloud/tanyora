"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppImage } from "@/components/ui/AppImage";
import { buildPricingPlans } from "@/features/subscriptions/plan-catalog";
import { PricingGrid } from "@/features/subscriptions/components/PricingGrid";
import { ConfirmFreeDowngradeDialog } from "@/features/subscriptions/components/ConfirmFreeDowngradeDialog";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import type { BillingHistoryItem, SubscriptionPlanId, SubscriptionPricingConfigResult, UserSubscriptionSnapshot } from "@/types/subscriptions";
import type { WordPressAccessMatrix } from "@/lib/api/wordpress-internal";
import { formatMoneyAmount } from "@/lib/pricing/format-money";

type ProfilePageProps = {
  user: {
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  };
  subscription: UserSubscriptionSnapshot;
  billingHistory: BillingHistoryItem[];
  pricingConfig?: SubscriptionPricingConfigResult | null;
  accessMatrix?: WordPressAccessMatrix | null;
};

const PROFILE_ACTIONS = [
  {
    href: "/profil/modifier",
    title: "Mes informations",
    subtitle: "Mettre à jour vos coordonnées, votre avatar et vos réseaux sociaux.",
    accent: "Compte",
  },
  {
    href: "/profil/petites-annonces",
    title: "Mes petites annonces",
    subtitle: "Créer, retrouver et gérer vos annonces depuis votre espace.",
    accent: "Annonce",
  },
  {
    href: "/profil/messages",
    title: "Mes messages",
    subtitle: "Retrouver les conversations liées à vos publications, côté annonceur comme demandeur.",
    accent: "Messages",
  },
  {
    href: "/profil/appels-offres",
    title: "Mes appels d'offres",
    subtitle: "Lancer une consultation et suivre les réponses reçues.",
    accent: "Appel",
  },
  {
    href: "/profil/offres-emploi",
    title: "Mes offres d'emploi",
    subtitle: "Publier des postes et suivre les candidats par offre.",
    accent: "Emploi",
  },
  {
    href: "/profil/saved",
    title: "Mes enregistrements",
    subtitle: "Retrouver rapidement les contenus que vous avez enregistrés.",
    accent: "Saved",
  },
] as const;

function formatPriceAr(value: number): string {
  return formatMoneyAmount(value, { currency: "MGA", zeroLabel: "Gratuit", suffix: "/ mois", useArForMga: true });
}

function formatMoney(value: number, currency: string) {
  if (currency.toUpperCase() === "MGA") {
    return formatMoneyAmount(value, { currency, useArForMga: true });
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

function formatSubscriptionStatus(status: UserSubscriptionSnapshot["status"]) {
  switch (status) {
    case "active":
      return "Actif";
    case "trialing":
      return "Activation en cours";
    case "past_due":
      return "Paiement à régulariser";
    case "canceled":
      return "Annulé";
    default:
      return "Aucun abonnement actif";
  }
}

function formatOrderStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "Réglé";
  if (normalized === "processing") return "Confirmé";
  if (normalized === "pending") return "En attente";
  if (normalized === "cancelled") return "Annulé";
  if (normalized === "failed") return "Échoué";
  return status;
}

function ActionCard({ href, title, subtitle, accent }: { href: string; title: string; subtitle: string; accent: string }) {
  return (
    <Link
      href={href}
      className="group ui-card-flat rounded-[24px] p-6 transition-colors hover:border-[#27624f]/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-[#27624f]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#27624f]">
            {accent}
          </span>
          <h3 className="ui-text-main mt-4 text-xl font-semibold">{title}</h3>
          <p className="ui-text-muted mt-3 max-w-[28ch] text-sm leading-6">{subtitle}</p>
        </div>
        <span
          aria-hidden="true"
          className="ui-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg transition-colors group-hover:border-[#27624f] group-hover:text-[#27624f]"
        >
          {"->"}
        </span>
      </div>
    </Link>
  );
}

export function ProfilePage({ user, subscription, billingHistory, pricingConfig = null, accessMatrix = null }: ProfilePageProps) {
  const router = useRouter();
  const { refreshSession, userPlan } = useAuth();
  const [planActionError, setPlanActionError] = useState<string | null>(null);
  const [confirmFreeOpen, setConfirmFreeOpen] = useState(false);
  const effectivePlan = (subscription.status !== "none" ? subscription.planId : userPlan === "visitor" ? subscription.planId : userPlan) as SubscriptionPlanId;
  const plans = useMemo(
    () =>
      buildPricingPlans({ pricingConfig, accessMatrix }).map((plan) => ({
        ...plan,
        cta: plan.id === effectivePlan ? "Plan actuel" : plan.cta,
      })),
    [accessMatrix, effectivePlan, pricingConfig],
  );
  const currentPlan = plans.find((plan) => plan.id === effectivePlan);
  const upgradePlans = plans.filter((plan) => plan.id !== "free");
  const isFreePlan = effectivePlan === "free";
  const hasAllPrivileges = subscription.accessGrant === "all_privileges";
  const accountCtaLabel = isFreePlan ? "Choisir mon offre" : "Changer de formule";
  const planPillLabel = hasAllPrivileges ? "All privileges" : currentPlan?.label ?? "Free";
  const displayName = user.name || "Utilisateur 2424";

  const businessDowngradeBlocked = effectivePlan === "business";

  async function handlePlanSelect(planId: SubscriptionPlanId) {
    setPlanActionError(null);

    if (businessDowngradeBlocked && planId === "essentiel") {
      throw new Error("Le plan Essentiel n'est pas disponible lorsque votre compte est deja en formule Business.");
    }

    if (planId === "free") {
      setConfirmFreeOpen(true);
      return;
    }

    router.push(`/checkout?plan=${planId}`);
  }

  return (
    <main className="profile-overview-page ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px] space-y-8">
        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[32px] bg-[linear-gradient(135deg,#111111,#222222)] p-8 text-white md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb5b8]">Dashboard profil</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em]">Bonjour {displayName}</h1>
            <p className="mt-4 max-w-[48ch] text-sm leading-7 text-white/75">
              Retrouvez ici un aperçu rapide de votre compte, votre formule actuelle et vos actions prioritaires.
            </p>

            <div className="mt-8 flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#27624f] bg-[#faf4f4]">
                {user.picture ? (
                  <AppImage alt="" className="h-full w-full object-cover" src={user.picture} eager />
                ) : (
                  <span className="text-xl font-semibold uppercase text-[#27624f]">
                    {(user.name || user.email || "24").slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-white">{displayName}</p>
                <p className="mt-1 text-sm text-white/70">{user.email}</p>
                <p className="mt-3 inline-flex rounded-full border border-[#27624f]/45 bg-[#27624f]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd6d8]">
                  {planPillLabel}
                </p>
              </div>
            </div>
          </div>

          <section className="ui-card rounded-[32px] p-8 md:p-10">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Compte</p>
                <h2 className="ui-text-main mt-3 text-3xl font-semibold tracking-[-0.03em]">Résumé du compte</h2>
              </div>
              <Link
                href="/profil/modifier"
                className="inline-flex items-center justify-center rounded-2xl border border-[#27624f] bg-[#27624f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#27624f]"
              >
                Mes informations
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="ui-surface-soft rounded-[22px] px-5 py-5">
                <p className="ui-text-soft text-xs uppercase tracking-[0.16em]">Formule</p>
                <p className="ui-text-main mt-3 text-3xl font-semibold">{planPillLabel}</p>
                {hasAllPrivileges ? <p className="ui-text-muted mt-5 text-sm">Accès administrateur gratuit et sans échéance.</p> : <Link href="/tarifs" className="mt-5 inline-flex min-h-12 w-fit items-center justify-center rounded-2xl border border-[#27624f] bg-[#27624f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#27624f]">{accountCtaLabel}</Link>}
              </div>
              <div className="ui-surface-soft rounded-[22px] px-5 py-5">
                <p className="ui-text-soft text-xs uppercase tracking-[0.16em]">Statut</p>
                <p className="ui-text-main mt-3 text-xl font-semibold">{hasAllPrivileges ? "Accès administrateur" : formatSubscriptionStatus(subscription.status)}</p>
              </div>
              <div className="ui-surface-soft rounded-[22px] px-5 py-5">
                <p className="ui-text-soft text-xs uppercase tracking-[0.16em]">Prochaine échéance</p>
                <p className="ui-text-main mt-3 text-xl font-semibold">{hasAllPrivileges ? "Sans échéance" : formatDate(subscription.renewsAt)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="ui-surface-soft rounded-[24px] border ui-border p-5">
                <p className="ui-text-soft text-xs uppercase tracking-[0.18em]">Informations</p>
                <p className="ui-text-main mt-3 text-lg font-semibold">{displayName}</p>
                <p className="ui-text-muted mt-2 text-sm">{user.email || "-"}</p>
              </article>
              <article className="ui-surface-soft rounded-[24px] border ui-border p-5">
                <p className="ui-text-soft text-xs uppercase tracking-[0.18em]">Abonnement</p>
                <p className="ui-text-main mt-3 text-lg font-semibold">{formatPriceAr(currentPlan?.monthlyPriceAr ?? 0)}</p>
                <p className="ui-text-muted mt-2 text-sm leading-6">{currentPlan?.description}</p>
              </article>
            </div>

          </section>
        </section>

        <section className="ui-card rounded-[32px] p-8 md:p-10">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Actions rapides</p>
              <h2 className="ui-text-main mt-3 text-3xl font-semibold tracking-[-0.03em]">Tout faire depuis votre espace</h2>
            </div>
            <p className="ui-text-muted max-w-[40ch] text-sm leading-6">
              Gérer votre compte, publier une annonce, lancer un appel d'offres ou suivre vos contenus en quelques clics.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {PROFILE_ACTIONS.map((action) => (
              <ActionCard key={action.href} {...action} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <section className="ui-card rounded-[32px] p-8 md:p-10">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Vos accès</p>
              <h2 className="ui-text-main mt-3 text-3xl font-semibold tracking-[-0.03em]">L'essentiel de votre formule</h2>
            </div>
            {planActionError ? (
              <div className="mb-5 rounded-2xl border border-[#f1b4b7] bg-[#fff4f5] px-4 py-3 text-sm text-[#9f1f28]">{planActionError}</div>
            ) : null}
            <PricingGrid
              plans={plans.map((plan) => ({
                ...plan,
                cta: effectivePlan === plan.id ? "Plan actuel" : plan.cta,
                selectable:
                  effectivePlan === plan.id
                    ? false
                    : businessDowngradeBlocked && plan.id === "essentiel"
                      ? false
                      : plan.selectable,
                disabledLabel:
                  effectivePlan === plan.id
                    ? "Plan actuel"
                    : businessDowngradeBlocked && plan.id === "essentiel"
                    ? "Votre formule actuelle est supérieure"
                    : plan.disabledLabel,
              }))}
              onSelect={(planId) => handlePlanSelect(planId).catch((error) => {
                setPlanActionError(getUserFacingErrorMessage(error, "Une erreur est survenue."));
              })}
            />
          </section>

          <section className="ui-card rounded-[32px] p-8 md:p-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Vos paiements</p>
                <h2 className="ui-text-main mt-3 text-3xl font-semibold tracking-[-0.03em]">Historique</h2>
              </div>
              <Link
                href="/profil/factures"
                className="ui-surface ui-text-main inline-flex items-center justify-center rounded-2xl border ui-border px-5 py-3 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
              >
                Voir toutes les factures
              </Link>
            </div>
            {billingHistory.length === 0 ? (
              <div className="ui-surface-soft ui-text-muted rounded-[24px] p-6 text-sm leading-7">
                Aucun paiement n'a encore été enregistré sur ce compte.
              </div>
            ) : (
              <div className="space-y-4">
                {billingHistory.slice(0, 4).map((item) => (
                  <article key={item.orderId} className="ui-surface-soft rounded-[24px] border ui-border p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a8a]">Commande #{item.orderNumber}</p>
                        <h3 className="ui-text-main mt-2 text-xl font-semibold">Plan {item.planId.toUpperCase()}</h3>
                        <p className="ui-text-muted mt-2 text-sm">{formatDate(item.paidAt || item.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="ui-text-main text-xl font-semibold">{formatMoney(item.total, item.currency)}</p>
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <span className="rounded-full bg-[#27624f]/10 px-3 py-1 text-xs font-semibold text-[#27624f]">{formatOrderStatus(item.status)}</span>
                          <span className="ui-surface rounded-full px-3 py-1 text-xs font-semibold ui-text-main">{item.paymentMethodLabel}</span>
                        </div>
                        {item.invoiceUrl ? (
                          <a
                            href={item.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center justify-end text-sm font-semibold text-[#27624f] transition hover:text-[var(--text-main)]"
                          >
                            Télécharger le PDF
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
      <ConfirmFreeDowngradeDialog
        isOpen={confirmFreeOpen}
        paidPlan={effectivePlan === "business" || effectivePlan === "essentiel" ? effectivePlan : undefined}
        onClose={() => setConfirmFreeOpen(false)}
        onSuccess={async () => {
          await refreshSession();
          router.refresh();
        }}
      />
    </main>
  );
}




