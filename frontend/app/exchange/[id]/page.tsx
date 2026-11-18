import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Info } from "lucide-react";
import { EXCHANGE_FIXTURES } from "@/lib/exchange/fixtures";
import styles from "@/features/exchange/ExchangeCatalog.module.css";

type Params = { id: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return EXCHANGE_FIXTURES.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const item = EXCHANGE_FIXTURES.find((fixture) => fixture.id === id);
  return {
    title: item ? `${item.title} | Exchange Tanyora` : "Pièce introuvable | Exchange Tanyora",
    description: item?.description || "Cette pièce de démonstration n'existe pas.",
    robots: { index: false, follow: false },
  };
}

export default async function ExchangeDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const item = EXCHANGE_FIXTURES.find((fixture) => fixture.id === id);
  if (!item) notFound();

  const position = EXCHANGE_FIXTURES.indexOf(item) + 1;
  const related = EXCHANGE_FIXTURES.filter((fixture) => fixture.id !== item.id && fixture.family === item.family).slice(0, 2);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/exchange#exchange-catalogue" className={styles.backLink}><ArrowLeft size={17} aria-hidden="true" /> Retour à Exchange</Link>
        <div className={styles.notice} role="note">
          <Info size={16} aria-hidden="true" />
          <span><strong>Fiche de démonstration.</strong> Pièce, vendeur, quantité et prix fictifs. Aucune demande de cotation ni commande n'est disponible.</span>
        </div>
        <article className={styles.detailPage}>
          <div className={styles.detailMedia}>
            <div className={styles.detailImage} style={{ backgroundPosition: item.imagePosition }} role="img" aria-label={`Illustration du spécimen fictif : ${item.title}`} />
            <p>Visuel d'illustration <span>EXEMPLE {String(position).padStart(2, "0")}</span></p>
          </div>
          <div className={styles.detailBody}>
            <p className={styles.eyebrow}>Exchange / {item.family} / {item.market === "local" ? "Local" : "International"}</p>
            <h1>{item.title}</h1>
            <p>{item.description}</p>
            <dl>
              <div><dt>Présentation</dt><dd>{item.specimen}</dd></div>
              <div><dt>Quantité</dt><dd>{item.quantity}</dd></div>
              <div><dt>Prix</dt><dd>{item.offer}</dd></div>
              <div><dt>Vendeur</dt><dd>{item.seller}</dd></div>
              <div><dt>Documents</dt><dd>Non vérifiés · démonstration</dd></div>
            </dl>
            <button type="button" disabled className={styles.disabledAction}>Demander une cotation · bientôt disponible</button>
            <small>Aucun contact, paiement ou engagement n'est possible sur cet exemple.</small>
          </div>
        </article>
        {related.length > 0 ? (
          <section className={styles.related} aria-labelledby="exchange-related-title">
            <div><p className={styles.eyebrow}>Poursuivre la découverte</p><h2 id="exchange-related-title">Dans la même famille</h2></div>
            <div>{related.map((fixture) => <Link href={`/exchange/${fixture.id}`} key={fixture.id}>{fixture.title}<ArrowUpRight size={16} aria-hidden="true" /></Link>)}</div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
