import Link from "next/link";
import { buildMetadata } from "@/app/metadata";
import { getWordPressNotificationPreference, updateWordPressNotificationPreference } from "@/lib/api/wordpress-internal";
import { buildNotificationPreferencesUrl, verifyNotificationUnsubscribeToken } from "@/lib/notifications/email-preferences";

export const metadata = buildMetadata(
  "Desinscription emails",
  "Gerez vos emails de notification Tanyora.",
);

export const dynamic = "force-dynamic";

type UnsubscribePageProps = {
  searchParams?: {
    email?: string;
    expires?: string;
    signature?: string;
  };
};

function getStatusCopy(status: "success" | "already_disabled" | "not_found" | "invalid") {
  switch (status) {
    case "success":
      return {
        eyebrow: "Emails mis a jour",
        title: "Vous etes desinscrit de ces emails",
        description:
          "Les emails de notification pour les nouveaux messages ont ete desactives. Vos notifications dans la cloche Tanyora continueront de fonctionner normalement.",
      };
    case "already_disabled":
      return {
        eyebrow: "Deja desinscrit",
        title: "Cette adresse ne recevait deja plus ces emails",
        description:
          "Aucune action supplementaire n'etait necessaire. Vous pourrez toujours reactiver ces emails depuis vos parametres de profil.",
      };
    case "not_found":
      return {
        eyebrow: "Lien traite",
        title: "Impossible de retrouver ce compte",
        description:
          "Nous n'avons pas trouve de compte Tanyora correspondant a ce lien. Si vous pensez qu'il s'agit d'une erreur, contactez notre support.",
      };
    default:
      return {
        eyebrow: "Lien invalide",
        title: "Ce lien de desinscription est invalide ou expire",
        description:
          "Demandez un nouvel email de notification ou connectez-vous a votre compte pour gerer vos preferences directement depuis votre profil.",
      };
  }
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const verification = verifyNotificationUnsubscribeToken({
    email: searchParams?.email,
    expires: searchParams?.expires,
    signature: searchParams?.signature,
  });

  let status: "success" | "already_disabled" | "not_found" | "invalid" = verification.ok ? "success" : "invalid";
  let resolvedEmail = verification.ok ? verification.email : String(searchParams?.email || "").trim().toLowerCase();

  if (verification.ok) {
    try {
      const currentPreference = await getWordPressNotificationPreference({ email: verification.email });

      if (!currentPreference.found) {
        status = "not_found";
      } else if (currentPreference.notificationEmailsEnabled === false) {
        status = "already_disabled";
      } else {
        const updatedPreference = await updateWordPressNotificationPreference({
          email: verification.email,
          notificationEmailsEnabled: false,
        });
        status = updatedPreference.notificationEmailsEnabled === false ? "success" : "invalid";
        resolvedEmail = updatedPreference.email || verification.email;
      }
    } catch (error) {
      console.error("[unsubscribe/page] unable to update notification preference", error);
      status = "invalid";
    }
  }

  const copy = getStatusCopy(status);
  const preferencesUrl = buildNotificationPreferencesUrl();

  return (
    <main className="ui-page-soft min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[560px] items-center justify-center">
        <section className="ui-card w-full rounded-[28px] px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">{copy.eyebrow}</p>
          <h1 className="ui-text-main mt-4 text-3xl font-semibold tracking-[-0.03em]">{copy.title}</h1>
          <p className="ui-text-muted mt-4 text-sm leading-7">{copy.description}</p>

          {resolvedEmail ? (
            <div className="ui-surface-soft ui-border ui-text-main mt-6 rounded-2xl border px-4 py-4 text-sm">
              <span className="ui-text-muted block text-xs uppercase tracking-[0.18em]">Adresse concernee</span>
              <span className="mt-2 block font-medium">{resolvedEmail}</span>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Retour a l&apos;accueil
            </Link>
            <Link
              href={preferencesUrl}
              className="ui-text-main ui-border-strong inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
            >
              Gerer mes preferences
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
