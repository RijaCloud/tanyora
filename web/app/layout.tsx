import type { Metadata } from "next";
import Link from "next/link";
import "./style.css";

export const metadata: Metadata = { title: "Tanyora | Minéraux, livres et savoirs", description: "Explorez les minéraux, demandez un devis et découvrez notre librairie." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body><header className="site-header"><Link className="brand" href="/">TANYORA<span>.</span></Link><nav aria-label="Navigation principale"><Link href="/minerais">Minéraux</Link><Link href="/livres">Livres</Link><Link href="/annuaire">Annuaire</Link></nav><span className="header-note">La matière et les savoirs</span></header>{children}<footer><strong>TANYORA.</strong><span>Plateforme de démonstration. Aucun paiement réel.</span></footer></body></html>;
}
