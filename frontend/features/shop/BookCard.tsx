import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import type { TanyoraBook } from "@/lib/api/wordpress-internal";
import { formatBookPrice } from "./book-format";
import styles from "./BookShop.module.css";

export function BookCard({ book }: { book: TanyoraBook }) {
  return (
    <Link className={styles.bookCard} href={`/boutique/${encodeURIComponent(book.slug)}`}>
      <div className={styles.cover}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={`Couverture de ${book.title}`} loading="lazy" />
        ) : (
          <div className={styles.coverPlaceholder} aria-hidden="true">
            <BookOpen size={46} strokeWidth={1.2} />
            <span>TANYORA / LIVRES</span>
          </div>
        )}
        <span className={styles.coverArrow} aria-hidden="true"><ArrowUpRight size={17} /></span>
      </div>
      <div className={styles.cardMeta}>
        <span>{book.format === "digital" ? "Livre numérique" : "Livre imprimé"}</span>
        <span>{formatBookPrice(book.price, book.currency)}</span>
      </div>
      <h2>{book.title}</h2>
      {book.author ? <p className={styles.author}>{book.author}</p> : null}
    </Link>
  );
}
