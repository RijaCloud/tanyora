"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, MapPin } from "lucide-react";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import { MINING_RESOURCES } from "@/lib/mining-resources";
import { EXCHANGE_FIXTURES } from "@/lib/exchange/fixtures";
import styles from "./TanyoraHome.module.css";
import { TANYORA_SHOP_VISIBLE } from "@/lib/tanyora-visibility";

export type TanyoraHomeListing = {
  id: number;
  title: string;
  category: string;
  location: string;
  image: string;
  price?: string;
  currency?: string;
};

function toHomeListing(value: Record<string, unknown>): TanyoraHomeListing | null {
  const id = Number(value.id);
  if (!Number.isSafeInteger(id) || id <= 0 || typeof value.title !== "string") return null;

  const images = Array.isArray(value.images) ? value.images : [];
  return {
    id,
    title: value.title,
    category: typeof value.category === "string" ? value.category : "",
    location: typeof value.location === "string" ? value.location : "",
    image: typeof value.image === "string" ? value.image : typeof images[0] === "string" ? images[0] : "",
    price: typeof value.price === "string" ? value.price : undefined,
    currency: typeof value.currency === "string" ? value.currency : undefined,
  };
}

export function TanyoraHome({ initialListings }: { initialListings: TanyoraHomeListing[] | null }) {
  const [listings, setListings] = useState(initialListings ?? []);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(initialListings === null ? "loading" : "ready");
  const showDemoPreview = status !== "loading" && listings.length === 0;

  useEffect(() => {
    if (initialListings !== null) return;
    const controller = new AbortController();

    async function loadListings() {
      try {
        const response = await fetch("/api/public/listings/classified?perPage=8", { signal: controller.signal });
        if (!response.ok) throw new Error("Listings unavailable");
        const payload: unknown = await response.json();
        const items = payload && typeof payload === "object" && "items" in payload ? payload.items : null;
        if (!Array.isArray(items)) throw new Error("Invalid listings response");
        setListings(items.map((item) => toHomeListing(item)).filter((item): item is TanyoraHomeListing => item !== null));
        setStatus("ready");
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("[home] unable to load classified listings", error);
          setStatus("error");
        }
      }
    }

    void loadListings();
    return () => controller.abort();
  }, [initialListings]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero} aria-labelledby="tanyora-home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> Tanyora / Exchange</p>
            <h1 id="tanyora-home-title">La matière, au centre des échanges.</h1>
            <p className={styles.heroDescription}>Explorez l'aperçu de notre future place de marché des minéraux. Les petites annonces actuelles restent accessibles plus bas.</p>
            <div className={styles.heroActions}>
              <Link href="/exchange" className={styles.primaryAction}>Découvrir Exchange <ArrowUpRight size={17} aria-hidden="true" /></Link>
              <Link href="/annuaire" className={styles.textAction}>Découvrir la communauté <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </div>
          <figure className={styles.heroVisual}>
            <img src="/images/tanyora-mineral-hero.png" alt="Cristaux verts sur une pierre claire, visuel d’illustration" fetchPriority="high" />
            <figcaption>Une matière, mille détails <span>01 / Tanyora</span></figcaption>
          </figure>
        </section>

        <div className={styles.indexStrip} aria-label="Explorer Tanyora">
          <span>Un marché de découvertes</span>
          <div>
            <Link href="/exchange">01 Exchange <ArrowUpRight size={14} aria-hidden="true" /></Link>
            {TANYORA_SHOP_VISIBLE ? <Link href="/boutique">02 Boutique <ArrowUpRight size={14} aria-hidden="true" /></Link> : null}
            <Link href="/annuaire">{TANYORA_SHOP_VISIBLE ? "03" : "02"} Annuaire <ArrowUpRight size={14} aria-hidden="true" /></Link>
          </div>
        </div>

        <section className={styles.marketplace} aria-labelledby="tanyora-marketplace-title">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>{showDemoPreview ? "Exchange / démonstration" : "Annonces actuelles"}</p>
              <h2 id="tanyora-marketplace-title">{showDemoPreview ? "Un premier regard sur Exchange" : <>La communauté <br className={styles.mobileBreak} />propose</>}</h2>
              <p>{showDemoPreview ? "Spécimens, vendeurs et prix fictifs pour imaginer le futur catalogue. Aucune offre n'est active." : "Des annonces publiées par la communauté, à parcourir à votre rythme."}</p>
            </div>
            <Link href={showDemoPreview ? "/exchange" : "/petites-annonces"} className={styles.sectionLink}>{showDemoPreview ? "Explorer l'aperçu" : "Voir toutes les annonces"} <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>

          {status === "loading" ? (
            <div className={styles.productGrid} aria-label="Chargement des annonces">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className={styles.skeleton} aria-hidden="true" />)}
            </div>
          ) : listings.length > 0 ? (
            <div className={styles.productGrid}>
              {listings.map((listing) => (
                <Link href={`/petites-annonces/${listing.id}`} key={listing.id} className={styles.productCard}>
                  <div className={styles.productImage}>
                    {listing.image ? <img src={listing.image} alt="" loading="lazy" /> : <span>Image à venir</span>}
                    <span className={styles.cardArrow}><ArrowUpRight size={16} aria-hidden="true" /></span>
                  </div>
                  <div className={styles.productMeta}>
                    <span>{listing.category || "Annonce"}</span>
                    {listing.location ? <span><MapPin size={12} aria-hidden="true" />{listing.location}</span> : null}
                  </div>
                  <h3>{listing.title}</h3>
                  {listing.price ? <p className={styles.price}>{formatListingMoney(listing.price, listing.currency)}</p> : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.productGrid} aria-label="Spécimens fictifs d'Exchange">
              {EXCHANGE_FIXTURES.slice(0, 4).map((item) => (
                <Link href={`/exchange/${item.id}`} key={item.id} className={styles.productCard}>
                  <div className={`${styles.productImage} ${styles.demoImage}`} style={{ backgroundPosition: item.imagePosition }}>
                    <span className={styles.demoBadge}>DÉMONSTRATION</span>
                    <span className={styles.cardArrow}><ArrowUpRight size={16} aria-hidden="true" /></span>
                  </div>
                  <div className={styles.productMeta}><span>{item.family}</span><span>{item.market === "local" ? "Local" : "International"}</span></div>
                  <h3>{item.title}</h3>
                  <p className={styles.price}>{item.offer}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {TANYORA_SHOP_VISIBLE ? <section className={styles.bookPromo} aria-labelledby="tanyora-books-title">
          <div className={styles.bookPromoMark}><BookOpen size={62} strokeWidth={1.15} aria-hidden="true" /><span>TANYORA / LIVRES</span></div>
          <div>
            <p className={styles.kicker}>La bibliothèque Tanyora</p>
            <h2 id="tanyora-books-title">Des ouvrages pour aller plus loin.</h2>
            <p>Livres numériques sur les minéraux, la géologie et les métiers du secteur minier. Les éditions imprimées suivront.</p>
            <Link href="/boutique">Explorer la boutique <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
        </section> : null}

        <section className={styles.resources} aria-labelledby="tanyora-resources-title">
          <div className={styles.resourcesHeading}>
            <p className={styles.kicker}>Pour aller plus loin</p>
            <h2 id="tanyora-resources-title">Ressources officielles</h2>
            <p>Deux points d’entrée publics pour s’informer sur le secteur minier malgache.</p>
          </div>
          <div className={styles.resourceList}>
            {MINING_RESOURCES.map((resource) => (
              <a key={resource.domain} href={resource.href} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                <span className={styles.resourceDomain}>{resource.domain}</span>
                <span className={styles.resourceName}>{resource.name}<ArrowUpRight size={19} aria-hidden="true" /></span>
                <span className={styles.resourceDescription}>{resource.description}</span>
              </a>
            ))}
          </div>
          <p className={styles.resourceNote}>Ces sites externes ne sont pas gérés par Tanyora.</p>
        </section>

        <section className={styles.community} aria-labelledby="tanyora-community-title">
          <div className={styles.communityIntro}>
            <p className={styles.kicker}>Au-delà des objets</p>
            <h2 id="tanyora-community-title">Des experts à rencontrer.</h2>
          </div>
          <div className={styles.communityDetail}>
            <p>Géologues, laboratoires et consultants du secteur minier ont leur place dans l’annuaire Tanyora.</p>
            <Link href="/annuaire">Explorer l’annuaire <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
          <span className={styles.communityDecoration} aria-hidden="true">T</span>
        </section>
      </div>
    </main>
  );
}
