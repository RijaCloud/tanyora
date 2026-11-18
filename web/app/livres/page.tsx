import Link from "next/link";
import { getBooks } from "@/lib/catalog";

export default async function Books() {const books=await getBooks();return <main className="inner"><div className="eyebrow">LA LIBRAIRIE / SÉLECTION ADMIN</div><h1>Des savoirs à emporter.</h1><p className="intro">Une sélection de livres numériques. Les achats sont simulés dans cette première version.</p><div className="grid books">{books.map((b)=><Link className="card" href={`/livres/${b.slug}`} key={b.slug}><div className={`book-cover ${b.color}`}><span>TANYORA<br/>ÉDITIONS</span><strong>{b.title}</strong></div><div className="card-content"><small>{b.author}</small><h3>{b.title}</h3><p>{b.price.toLocaleString("fr-FR")} Ar</p></div></Link>)}</div></main>}
