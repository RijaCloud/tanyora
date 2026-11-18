import Link from "next/link";
import { notFound } from "next/navigation";
import { getMinerals } from "@/lib/catalog";

export default async function MineralDetail({ params }: { params: { slug: string } }) {
  const minerals = await getMinerals();
  const item = minerals.find((m)=>m.slug===params.slug);
  if (!item) notFound();
  return <main className="inner detail"><Link className="back" href="/minerais">← Tous les minéraux</Link><div className={`specimen large ${item.color}`} aria-hidden="true"><span>{item.name.slice(0,2)}</span></div><div><div className="eyebrow">LOT / {item.type.toUpperCase()}</div><h1>{item.name}</h1><p className="intro">{item.description}</p><dl><div><dt>Origine déclarée</dt><dd>{item.origin}</dd></div><div><dt>Poids déclaré</dt><dd>{item.weight}</dd></div><div><dt>Disponibilité</dt><dd>À confirmer</dd></div></dl><p className="notice">Cette fiche utilise des données fictives de démonstration.</p><Link className="button" href={`/minerais/${item.slug}/devis`}>Demander un devis ↗</Link></div></main>;
}
