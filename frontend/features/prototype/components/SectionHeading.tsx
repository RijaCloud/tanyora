import Link from "next/link";

type SectionHeadingProps = {
  title: string;
  /** Destination du « Voir plus ». Omettre pour une bande sans lien. */
  href?: string;
  linkLabel?: string;
};

/**
 * Titre de bande de la page d'accueil.
 *
 * Chaque bande correspond a un domaine de la plateforme et n'expose qu'un seul
 * lien « Voir plus ». Les sous-blocs a l'interieur d'une bande utilisent un
 * titre plus petit, pour que la hierarchie reste lisible au premier coup d'oeil.
 */
export function SectionHeading({ title, href, linkLabel = "Voir plus" }: SectionHeadingProps) {
  return (
    <div className="ui-section-heading mb-3 flex items-baseline justify-between gap-4 border-b border-[color:var(--border-soft)] pb-2">
      <h2 className="text-[18px] font-semibold leading-tight text-[var(--text-main)] lg:text-[20px]">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-[11px] font-semibold text-[#27624f] transition-colors hover:text-[#a81720]"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
