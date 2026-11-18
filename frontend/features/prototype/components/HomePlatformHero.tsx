import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  Mail,
  Newspaper,
  Radio,
  Tag,
} from "lucide-react";

import { Link } from "@/features/prototype/router-compat";

const platformFeatures = [
  { title: "Actualités", description: "Les informations qui comptent, en continu.", href: "/actualites", icon: Newspaper, accent: "text-[#27624f]" },
  { title: "Annonces", description: "Acheter, vendre et trouver près de chez vous.", href: "/petites-annonces", icon: Tag, accent: "text-[#d97706]" },
  { title: "Emploi", description: "Les opportunités pour faire avancer votre carrière.", href: "/offres-emploi", icon: BriefcaseBusiness, accent: "text-[#5b5fc7]" },
  { title: "Appels d’offres", description: "Les consultations et échéances à suivre.", href: "/appel-offres", icon: FileText, accent: "text-[#0f766e]" },
  { title: "Annuaire", description: "Les entreprises et services utiles, simplement.", href: "/annuaire", icon: Mail, accent: "text-[#2563eb]" },
  { title: "Web radio", description: "Bientôt disponible sur Tanyora.", href: "/radio", icon: Radio, accent: "text-[#b45309]", comingSoon: true },
];

export function HomePlatformHero() {
  return (
    <section className="home-platform-hero mb-8 lg:mb-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.45fr)] lg:items-center">
        <div className="max-w-[440px]">
          <p className="ui-section-kicker mb-3">TANYORA · LA PLATEFORME</p>
          <h1 className="home-platform-hero-title text-[clamp(2rem,4vw,3.65rem)] font-semibold text-[var(--text-main)]">
            Les trésors de Madagascar, à découvrir.
          </h1>
          <p className="mt-3 max-w-[38ch] text-[0.9375rem] leading-6 text-[var(--text-muted)]">
            Explorez les minéraux, les livres et les découvertes de notre île.
          </p>
          <div className="home-platform-actions mt-5 flex flex-wrap gap-3">
            <Link to="/actualites" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#27624f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#194a3d]">
              Voir l’actualité <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link to="/petites-annonces" className="inline-flex min-h-11 items-center rounded-full border border-[var(--border-strong)] px-5 text-sm font-semibold text-[var(--text-main)] transition-colors hover:border-[#27624f] hover:text-[#27624f]">
              Explorer les annonces
            </Link>
          </div>
        </div>

        <div className="home-platform-feature-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {platformFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} to={feature.href} className="home-platform-feature group">
                <div className={`home-platform-feature-icon ${feature.accent}`}><Icon className="h-5 w-5" strokeWidth={1.8} /></div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[0.95rem] font-semibold leading-5 text-[var(--text-main)]">{feature.title}</h2>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#27624f]" />
                  </div>
                  <p className="mt-1.5 text-[0.75rem] leading-[1.45] text-[var(--text-muted)]">{feature.description}</p>
                  {feature.comingSoon ? <span className="ui-tag mt-3 bg-[#f5a524]/15 text-[#a15c00]">Bientôt</span> : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
