import Link from "next/link";
import { getMinerals } from "@/lib/catalog";

export default async function Minerals({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const minerals = await getMinerals();
  const q = (searchParams.q || "").toLocaleLowerCase("fr").trim();
  const type = searchParams.type || "";
  const items = minerals.filter((m) => (!q || `${m.name} ${m.origin} ${m.type}`.toLocaleLowerCase("fr").includes(q)) && (!type || m.type === type));
  return <main className="inner"><div className="eyebrow">CATALOGUE / MINÉRAUX</div><h1>Explorer la matière.</h1><p className="intro">Des lots déclarés par leurs vendeurs. Demandez un devis pour connaître leur disponibilité et leurs conditions.</p><form className="filters" action="/minerais"><label>Rechercher<input name="q" type="search" defaultValue={searchParams.q || ""} placeholder="Nom, origine, famille" /></label><label>Famille<select name="type" defaultValue={type}><option value="">Toutes les familles</option>{Array.from(new Set(minerals.map((m)=>m.type))).map((t)=><option key={t}>{t}</option>)}</select></label><button type="submit">Filtrer ↗</button></form><p className="count">{items.length} lot{items.length > 1 ? "s" : ""}</p>{items.length ? <div className="grid">{items.map((m)=><Link className="card" href={`/minerais/${m.slug}`} key={m.slug}><div className={`specimen ${m.color}`} aria-hidden="true"><span>{m.name.slice(0,2)}</span></div><div className="card-content"><small>{m.type} · {m.origin}</small><h3>{m.name}</h3><p>{m.weight} · Devis sur demande</p></div></Link>)}</div> : <div className="empty">Aucun lot ne correspond à votre recherche. <Link href="/minerais">Effacer les filtres</Link></div>}</main>;
}
