import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { buildMetadata } from "@/app/metadata";
import { getTanyoraBooks, type TanyoraBooksResult } from "@/lib/api/wordpress-internal";
import { BookCard } from "@/features/shop/BookCard";
import styles from "@/features/shop/BookShop.module.css";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata("Boutique de livres", "Livres numériques et ouvrages spécialisés sur les minéraux, la géologie et le secteur minier à Madagascar.", { path: "/boutique" });

export default async function BookShopPage({ searchParams }: { searchParams?: { page?: string } }) {
  const requestedPage = Number.parseInt(searchParams?.page || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.min(requestedPage, 1000)) : 1;
  let catalog: TanyoraBooksResult | null = null;

  try {
    catalog = await getTanyoraBooks(page);
  } catch (error) {
    console.error("[book-shop] unable to load catalog", error);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>TANYORA / LA BIBLIOTHÈQUE</p>
            <h1>Des livres pour lire le sous-sol autrement.</h1>
            <p className={styles.heroDescription}>Une sélection d’ouvrages sur les minéraux, la géologie et les métiers du secteur minier. Des éditions numériques d’abord, puis des livres imprimés.</p>
          </div>
          <div className={styles.heroAside}>
            <BookOpen size={36} strokeWidth={1.3} aria-hidden="true" />
            <span>01 / Connaissances</span>
            <p>La boutique est en préparation. Les achats en ligne seront ouverts dans une prochaine étape.</p>
          </div>
        </header>

        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>LE CATALOGUE</p>
            <h2>À feuilleter</h2>
          </div>
          {catalog && catalog.pagination.total > 0 ? <span>{catalog.pagination.total} ouvrage{catalog.pagination.total > 1 ? "s" : ""}</span> : null}
        </div>

        {!catalog ? (
          <div className={styles.emptyState} role="status">
            <BookOpen size={34} strokeWidth={1.3} aria-hidden="true" />
            <h3>La boutique est momentanément indisponible.</h3>
            <p>Revenez dans quelques instants pour découvrir les ouvrages.</p>
          </div>
        ) : catalog.items.length ? (
          <>
            <div className={styles.grid}>{catalog.items.map((book) => <BookCard book={book} key={book.id} />)}</div>
            {catalog.pagination.totalPages > 1 ? (
              <nav className={styles.pagination} aria-label="Pages de la boutique">
                {page > 1 ? <Link href={page === 2 ? "/boutique" : `/boutique?page=${page - 1}`}><ArrowLeft size={16} /> Précédent</Link> : <span />}
                <span>Page {page} sur {catalog.pagination.totalPages}</span>
                {page < catalog.pagination.totalPages ? <Link href={`/boutique?page=${page + 1}`}>Suivant <ArrowRight size={16} /></Link> : <span />}
              </nav>
            ) : null}
          </>
        ) : (
          <div className={styles.emptyState}>
            <BookOpen size={34} strokeWidth={1.3} aria-hidden="true" />
            <h3>{page > 1 ? "Aucun livre sur cette page." : "Les premiers livres arrivent bientôt."}</h3>
            <p>La collection sera consacrée aux minéraux, à la géologie et aux savoirs du secteur minier.</p>
            <Link href={page > 1 ? "/boutique" : "/petites-annonces"}>{page > 1 ? "Revenir au catalogue" : "Explorer les annonces"} <ArrowRight size={16} /></Link>
          </div>
        )}
      </div>
    </main>
  );
}
