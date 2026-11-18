import Link from "next/link";
import { notFound } from "next/navigation";
import { getMinerals } from "@/lib/catalog";

export default async function Quote({ params }: { params: { slug: string } }) {
  const minerals = await getMinerals();
  const item=minerals.find((m)=>m.slug===params.slug); if(!item) notFound();
  return <main className="inner narrow"><Link className="back" href={`/minerais/${item.slug}`}>← Retour au lot</Link><div className="eyebrow">DEMANDE DE DEVIS</div><h1>{item.name}</h1><p className="intro">Le parcours de devis sera activé après connexion du backend Tanyora. Aucun message n’est envoyé dans cette démonstration.</p><form className="form"><label>Quantité souhaitée<input type="number" min="1" disabled /></label><label>Destination<input type="text" disabled /></label><label>Votre message<textarea rows={5} disabled /></label><button type="button" disabled>Envoi bientôt disponible</button></form></main>;
}
