import Link from "next/link";
import { notFound } from "next/navigation";
import { getBooks } from "@/lib/catalog";

export default async function BookDetail({params}:{params:{slug:string}}){const books=await getBooks();const b=books.find((v)=>v.slug===params.slug);if(!b)notFound();return <main className="inner detail"><Link className="back" href="/livres">← Tous les livres</Link><div className={`book-cover large ${b.color}`}><span>TANYORA ÉDITIONS</span><strong>{b.title}</strong></div><div><div className="eyebrow">LIVRE NUMÉRIQUE / PDF</div><h1>{b.title}</h1><p className="intro">{b.summary}</p><dl><div><dt>Auteur</dt><dd>{b.author}</dd></div><div><dt>Prix indicatif</dt><dd>{b.price.toLocaleString("fr-FR")} Ar</dd></div></dl><p className="notice">Aucun achat ni téléchargement n’est encore activé dans cette démonstration.</p><button className="button" disabled>Simulation bientôt disponible</button></div></main>}
