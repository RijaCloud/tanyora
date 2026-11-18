import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { cache } from "react";
import { buildMetadata } from "@/app/metadata";
import { getTanyoraBook } from "@/lib/api/wordpress-internal";
import { formatBookPrice } from "@/features/shop/book-format";
import styles from "@/features/shop/BookShop.module.css";

export const dynamic = "force-dynamic";

const loadBook = cache((slug: string) => getTanyoraBook(slug));

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const { item } = await loadBook(params.slug);
    if (item) return buildMetadata(item.title, item.summary || "Découvrez cet ouvrage dans la boutique Tanyora.", { path: `/boutique/${encodeURIComponent(item.slug)}`, image: item.coverUrl || undefined });
  } catch {
    // The page below displays a temporary unavailable state.
  }
  return buildMetadata("Livre", "Découvrez les ouvrages de la boutique Tanyora.");
}

export default async function BookPage({ params }: { params: { slug: string } }) {
  let result: Awaited<ReturnType<typeof loadBook>>;
  try {
    result = await loadBook(params.slug);
  } catch (error) {
    console.error("[book-shop] unable to load book", error);
    return <main className={styles.page}><div className={styles.shell}><Link className={styles.backLink} href="/boutique"><ArrowLeft size={16} /> Retour à la boutique</Link><div className={styles.emptyState}><h1>Ce livre est momentanément indisponible.</h1><p>Veuillez réessayer dans quelques instants.</p></div></div></main>;
  }

  if (!result.item) notFound();
  const book = result.item;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href="/boutique"><ArrowLeft size={16} /> Retour à la boutique</Link>
        <article className={styles.detail}>
          <div className={styles.detailCover}>
            {book.coverUrl ? <img src={book.coverUrl} alt={`Couverture de ${book.title}`} /> : <div className={styles.coverPlaceholder} aria-hidden="true"><BookOpen size={70} strokeWidth={1.1} /><span>TANYORA / LIVRES</span></div>}
          </div>
          <div className={styles.detailCopy}>
            <p className={styles.eyebrow}>LA BIBLIOTHÈQUE TANYORA / {book.format === "digital" ? "NUMÉRIQUE" : "IMPRIMÉ"}</p>
            <h1>{book.title}</h1>
            {book.author ? <p className={styles.detailAuthor}>Par {book.author}</p> : null}
            {book.summary ? <p className={styles.detailSummary}>{book.summary}</p> : null}
            <div className={styles.detailFacts}>
              <div><span>Format</span><strong>{book.format === "digital" ? "Livre numérique" : "Livre imprimé"}</strong></div>
              {book.isbn ? <div><span>ISBN</span><strong>{book.isbn}</strong></div> : null}
              <div><span>Prix indicatif</span><strong>{formatBookPrice(book.price, book.currency)}</strong></div>
            </div>
            <p className={styles.availability}>L’achat en ligne n’est pas encore ouvert. Aucun paiement ni téléchargement n’est proposé sur cette page.</p>
            {book.description ? <section className={styles.description}><h2>À propos de ce livre</h2><p>{book.description}</p></section> : null}
          </div>
        </article>
      </div>
    </main>
  );
}
