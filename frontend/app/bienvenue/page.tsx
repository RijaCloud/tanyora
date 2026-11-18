import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Gem, MapPinned, MessageCircle, Store } from "lucide-react";
import { buildMetadata } from "@/app/metadata";
import { sanitizeReturnTo } from "@/lib/auth/flow";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getServerSession } from "@/lib/auth/session";
import styles from "./welcome.module.css";

export const metadata = buildMetadata("Bienvenue sur Tanyora", "Découvrez comment acheter, vendre et trouver les bons interlocuteurs sur Tanyora.", { path: "/bienvenue", noIndex: true });

export default function WelcomePage({ searchParams }: { searchParams?: { returnTo?: string } }) {
  const user = requireAuthenticatedUser(getServerSession(), { returnTo: "/bienvenue" });
  const returnTo = sanitizeReturnTo(searchParams?.returnTo);
  const firstName = user.firstName?.trim() || user.name?.trim().split(/\s+/)[0] || "";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>TANYORA / VOTRE POINT DE DÉPART</p>
            <h1>Bienvenue{firstName ? `, ${firstName}` : ""}. Explorez à votre rythme.</h1>
            <p>Vous n’avez rien à choisir maintenant. Consultez les annonces, découvrez les spécialistes et revenez plus tard pour acheter, vendre ou faire les deux avec le même compte.</p>
          </div>
          <div className={styles.heroMark} aria-hidden="true"><Gem size={78} strokeWidth={1.1} /><span>01 / EXPLORER</span></div>
        </header>

        <section className={styles.section} aria-labelledby="choose-path">
          <div className={styles.sectionHeading}><span>01</span><h2 id="choose-path">Quand vous serez prêt à passer à l’action</h2></div>
          <div className={styles.paths}>
            <article className={styles.path}>
              <Compass size={28} strokeWidth={1.5} aria-hidden="true" />
              <h3>Acheter</h3>
              <p>Parcourez les annonces et contactez le vendeur. Avant une transaction, demandez la nature du produit, son origine et les justificatifs de provenance. Si vous achetez pour revendre, vérifiez les autorisations applicables à cette activité.</p>
              <Link href="/petites-annonces">Explorer les annonces <ArrowRight size={18} aria-hidden="true" /></Link>
            </article>
            <article className={styles.path}>
              <Store size={28} strokeWidth={1.5} aria-hidden="true" />
              <h3>Vendre</h3>
              <p>Avant de proposer un produit minier, vérifiez votre droit de le commercialiser et ses justificatifs d’origine. Décrivez honnêtement la pierre, notamment tout traitement ou caractère synthétique. Les produits de prospection ou de recherche ne peuvent pas être commercialisés.</p>
              <Link href="/profil/petites-annonces/nouveau">Créer une annonce <ArrowRight size={18} aria-hidden="true" /></Link>
            </article>
          </div>
        </section>

        <aside className={styles.legalNote} aria-label="Repères réglementaires">
          <div><span className={styles.noteLabel}>REPÈRES UTILES</span><h2>Les démarches dépendent de votre activité et du minéral.</h2></div>
          <div>
            <p>L’achat-revente de produits miniers est encadré : autorisation de l’Administration minière, carte fiscale valide et tenue des registres pour l’acheteur-revendeur. Une autorisation d’achat-revente ne remplace pas un permis d’exploitation ni les documents de transport.</p>
            <p className={styles.legalCaveat}>Ces repères ne constituent pas une validation de votre situation. Avant de conclure une transaction, confirmez les exigences applicables auprès de l’Administration minière ou d’un professionnel compétent. Tanyora ne vérifie pas automatiquement les documents.</p>
            <div className={styles.sources}><span>Textes officiels :</span> <a href="https://cnlegis.gov.mg/uploads/L2023-007-VF.pdf" target="_blank" rel="noopener noreferrer">Code minier, art. 319 à 324</a><a href="https://cnlegis.gov.mg/uploads/D2024-1464-VF.pdf" target="_blank" rel="noopener noreferrer">Décret 2024-1464, art. 269 à 272</a></div>
          </div>
        </aside>

        <section className={styles.more} aria-labelledby="more-title">
          <div className={styles.sectionHeading}><span>02</span><h2 id="more-title">Vous n’êtes pas seul dans vos démarches.</h2></div>
          <div className={styles.moreGrid}>
            <div><MapPinned size={25} aria-hidden="true" /><h3>Trouver un spécialiste</h3><p>Consultez l’annuaire des géologues, consultants et partenaires du secteur minier.</p><Link href="/annuaire">Voir l’annuaire <ArrowRight size={16} aria-hidden="true" /></Link></div>
            <div><MessageCircle size={25} aria-hidden="true" /><h3>Une question sur vos documents ?</h3><p>L’assistant peut vous orienter. Les documents et obligations applicables doivent ensuite être confirmés avec l’équipe ou un professionnel compétent.</p><span className={styles.pending}>Accompagnement humain en préparation</span></div>
            <div><BookOpen size={25} aria-hidden="true" /><h3>Approfondir vos connaissances</h3><p>Découvrez le catalogue de livres sur les minéraux et les métiers du secteur.</p><Link href="/boutique">Découvrir les livres <ArrowRight size={16} aria-hidden="true" /></Link></div>
          </div>
        </section>

        <div className={styles.continue}><p>Aucun parcours à choisir : vous pourrez retrouver ces possibilités à tout moment depuis le menu.</p><Link href={returnTo}>Continuer sur Tanyora <ArrowRight size={18} aria-hidden="true" /></Link></div>
      </div>
    </main>
  );
}
