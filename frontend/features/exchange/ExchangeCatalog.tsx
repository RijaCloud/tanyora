"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info, Search, SlidersHorizontal } from "lucide-react";
import { EXCHANGE_FIXTURES, filterExchangeFixtures, type ExchangeFixture } from "@/lib/exchange/fixtures";
import styles from "./ExchangeCatalog.module.css";

const families = ["all", "Pierres précieuses", "Pierres fines", "Collection"] as const;
const markets = ["all", "local", "international"] as const;

function marketLabel(market: ExchangeFixture["market"]) {
  return market === "local" ? "Marché local" : "International";
}

export function ExchangeCatalog() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string>("all");
  const [market, setMarket] = useState<string>("all");
  const items = useMemo(() => filterExchangeFixtures(query, family, market), [query, family, market]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.notice} role="status">
          <Info size={16} aria-hidden="true" />
          <span><strong>Catalogue de démonstration.</strong> Pièces, vendeurs, volumes et prix fictifs. Aucune cotation ni commande n'est ouverte.</span>
        </div>

        <header className={styles.intro}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>Tanyora <span>/</span> Place de marché</p>
            <h1>Exchange<span>.</span></h1>
            <p className={styles.lead}>Des minéraux à découvrir. Des échanges à construire avec les bons interlocuteurs.</p>
            <p className={styles.explanation}>Cet aperçu montre comment seront présentées les pièces et leurs informations essentielles. Les vérifications des acteurs précéderont toute opération commerciale.</p>
            <a href="#exchange-catalogue" className={styles.introAction}>Explorer les pièces <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
          <div className={styles.introVisual} role="img" aria-label="Illustration de démonstration d'un cristal de saphir brut">
            <span>APERÇU / 01</span>
            <div><strong>Saphir brut bleu</strong><small>Spécimen fictif · Madagascar</small></div>
          </div>
        </header>

        <section id="exchange-catalogue" className={styles.catalogue} aria-labelledby="exchange-catalogue-title">
          <div className={styles.catalogueHeading}>
            <div>
              <p className={styles.eyebrow}>Explorer par matière</p>
              <h2 id="exchange-catalogue-title">Pièces en aperçu</h2>
            </div>
            <span>{items.length} exemple{items.length !== 1 ? "s" : ""}</span>
          </div>

          <div className={styles.catalogueLayout}>
            <aside className={styles.filters} aria-label="Filtres du catalogue de démonstration">
              <div className={styles.filtersTitle}><SlidersHorizontal size={16} aria-hidden="true" /><strong>Affiner</strong></div>
              <label className={styles.searchLabel} htmlFor="exchange-search">Rechercher</label>
              <div className={styles.searchBox}><Search size={17} aria-hidden="true" /><input id="exchange-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Saphir, quartz…" /></div>

              <div className={styles.filterGroup}>
                <p>Famille</p>
                {families.map((value) => (
                  <button type="button" key={value} className={family === value ? styles.activeFilter : ""} onClick={() => setFamily(value)} aria-pressed={family === value}>
                    <span>{value === "all" ? "Toutes les matières" : value}</span>
                    <span>{value === "all" ? EXCHANGE_FIXTURES.length : EXCHANGE_FIXTURES.filter((item) => item.family === value).length}</span>
                  </button>
                ))}
              </div>

              <div className={styles.filterGroup}>
                <p>Marché simulé</p>
                {markets.map((value) => (
                  <button type="button" key={value} className={market === value ? styles.activeFilter : ""} onClick={() => setMarket(value)} aria-pressed={market === value}>
                    <span>{value === "all" ? "Tous les marchés" : value === "local" ? "Local" : "International"}</span>
                    <span>{value === "all" ? EXCHANGE_FIXTURES.length : EXCHANGE_FIXTURES.filter((item) => item.market === value).length}</span>
                  </button>
                ))}
              </div>
              <p className={styles.filterNote}>Les filtres ne consultent aucune offre réelle.</p>
            </aside>

            <div className={styles.results}>
              <div className={styles.resultsToolbar}><span>Catalogue / démonstration</span><span>Photos d'illustration</span></div>
              {items.length ? (
                <div className={styles.grid}>
                  {items.map((item) => (
                    <Link href={`/exchange/${item.id}`} className={styles.card} key={item.id} aria-label={`Voir la fiche de ${item.title}`}>
                      <div className={styles.cardImage} style={{ backgroundPosition: item.imagePosition }}>
                        <span>EXEMPLE {String(EXCHANGE_FIXTURES.indexOf(item) + 1).padStart(2, "0")}</span>
                      </div>
                      <div className={styles.cardMeta}><span>{item.family}</span><span>{marketLabel(item.market)}</span></div>
                      <h3>{item.title}</h3>
                      <p className={styles.specimen}>{item.specimen}</p>
                      <div className={styles.cardFoot}><strong>{item.offer}</strong><ArrowUpRight size={17} aria-hidden="true" /></div>
                    </Link>
                  ))}
                </div>
              ) : <p className={styles.empty}>Aucun exemple ne correspond à ces filtres. Essayez une autre matière ou un autre marché.</p>}

            </div>
          </div>
        </section>

        <div className={styles.legacyLink}>
          <div><p className={styles.eyebrow}>À côté d'Exchange</p><strong>Les annonces actuelles restent accessibles.</strong></div>
          <Link href="/petites-annonces">Voir les petites annonces <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </div>
    </main>
  );
}
