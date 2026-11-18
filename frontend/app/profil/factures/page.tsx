import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";
import type { BillingHistoryItem } from "@/types/subscriptions";
import { formatMoneyAmount } from "@/lib/pricing/format-money";

const ITEMS_PER_PAGE = 10;

function parsePage(value?: string) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
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

function formatOrderStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "Réglé";
  if (normalized === "processing") return "Confirmé";
  if (normalized === "pending") return "En attente";
  if (normalized === "cancelled") return "Annulé";
  if (normalized === "failed") return "Échoué";
  return status;
}

function InvoiceCard({ item }: { item: BillingHistoryItem }) {
  return (
    <article className="ui-card rounded-[24px] p-6 shadow-[0_14px_34px_rgba(17,17,17,0.04)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="ui-text-soft text-xs font-semibold uppercase tracking-[0.18em]">Commande #{item.orderNumber}</p>
          <h2 className="ui-text-main mt-2 text-2xl font-semibold">Plan {item.planId.toUpperCase()}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#27624f]/10 px-3 py-1 text-xs font-semibold text-[#27624f]">{formatOrderStatus(item.status)}</span>
            <span className="ui-surface-soft ui-text-main rounded-full px-3 py-1 text-xs font-semibold">{item.paymentMethodLabel}</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[360px]">
          <div className="ui-surface-soft rounded-[18px] px-4 py-4">
            <p className="ui-text-soft text-xs uppercase tracking-[0.16em]">Montant</p>
            <p className="ui-text-main mt-2 text-lg font-semibold">{formatMoney(item.total, item.currency)}</p>
          </div>
          <div className="ui-surface-soft rounded-[18px] px-4 py-4">
            <p className="ui-text-soft text-xs uppercase tracking-[0.16em]">Date</p>
            <p className="ui-text-main mt-2 text-lg font-semibold">{formatDate(item.paidAt || item.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/profil"
          className="ui-surface ui-text-main ui-border rounded-2xl border px-5 py-3 text-center text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
        >
          Retour au profil
        </Link>
        {item.invoiceUrl ? (
          <a
            href={item.invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-[#27624f] bg-[#27624f] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white hover:text-[#27624f]"
          >
            Télécharger la facture PDF
          </a>
        ) : (
          <span className="ui-surface-disabled ui-border rounded-2xl border px-5 py-3 text-center text-sm font-semibold">
            PDF indisponible
          </span>
        )}
      </div>
    </article>
  );
}

export default async function ProfilFacturesPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil/factures" });
  const userId = String(session.wpUserId || session.email || "anonymous");
  const billingHistory = await subscriptionProvider.getBillingHistory(userId);
  const totalItems = billingHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(parsePage(searchParams?.page), totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = billingHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1180px] space-y-8">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,_#111111,_#2b2b2b)] p-8 text-white md:p-10">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb6b8]">
            Facturation
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em]">Toutes vos factures</h1>
          <p className="mt-4 max-w-[52ch] text-sm leading-7 text-white/78 md:text-base">
            Consultez l&apos;historique complet de vos paiements, retrouvez vos numéros de commande et téléchargez vos factures PDF quand elles sont disponibles.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-white/75">
            <span className="rounded-full border border-white/15 px-3 py-1">{totalItems} facture{totalItems > 1 ? "s" : ""}</span>
            <span className="rounded-full border border-white/15 px-3 py-1">Page {currentPage} / {totalPages}</span>
          </div>
          <div className="mt-8 rounded-[24px] border border-white/15 bg-white/5 p-5 text-sm leading-6 text-white/78">
            Les abonnements sont renouvelés manuellement. Retrouvez ici toutes vos commandes et la date d&apos;expiration de votre accès dans votre profil.
          </div>
        </section>

        {currentItems.length === 0 ? (
          <section className="ui-card ui-text-muted rounded-[32px] p-8 text-sm leading-7 md:p-10">
            Aucune facture n&apos;a encore été enregistrée sur ce compte.
          </section>
        ) : (
          <section className="space-y-5">
            {currentItems.map((item) => (
              <InvoiceCard key={item.orderId} item={item} />
            ))}
          </section>
        )}

        {totalPages > 1 ? (
          <nav className="ui-card flex flex-col gap-3 rounded-[28px] p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="ui-text-muted text-sm leading-6">
              Affichage de {startIndex + 1} à {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} sur {totalItems} facture{totalItems > 1 ? "s" : ""}.
            </p>
            <div className="flex gap-3">
              <Link
                href={currentPage > 1 ? `/profil/factures?page=${currentPage - 1}` : "#"}
                aria-disabled={currentPage <= 1}
                className={`rounded-2xl border px-5 py-3 text-center text-sm font-semibold transition ${
                  currentPage <= 1
                    ? "pointer-events-none cursor-not-allowed ui-surface-disabled ui-border"
                    : "ui-surface ui-text-main ui-border hover:border-[#27624f] hover:text-[#27624f]"
                }`}
              >
                Page précédente
              </Link>
              <Link
                href={currentPage < totalPages ? `/profil/factures?page=${currentPage + 1}` : "#"}
                aria-disabled={currentPage >= totalPages}
                className={`rounded-2xl border px-5 py-3 text-center text-sm font-semibold transition ${
                  currentPage >= totalPages
                    ? "pointer-events-none cursor-not-allowed border-[#e2e2e2] bg-[#f3f3f3] text-[#9a9a9a]"
                    : "border-[#27624f] bg-[#27624f] text-white hover:bg-white hover:text-[#27624f]"
                }`}
              >
                Page suivante
              </Link>
            </div>
          </nav>
        ) : null}
      </div>
    </main>
  );
}

