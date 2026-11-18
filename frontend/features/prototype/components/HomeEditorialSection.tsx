"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, FileText, Mail, Newspaper, Radio, Tag } from "lucide-react";
import { HomeEditorialSliders, HomeNewsColumn } from "@/features/prototype/components/HomeEditorialSliders";
import { HomeMarketplaceSidebar } from "@/features/prototype/components/HomeMarketplaceSection";
import { HomeTopJobsSidebar } from "@/features/prototype/components/HomeTopJobsSection";
import { HomeTendersSidebar } from "@/features/prototype/components/HomeTendersSection";
import { AdSlot } from "@/components/ads/AdSlot";
import { humanizeCategoryLabel } from "@/features/news/lib/category-label";
import { NEWS_IMAGE_PLACEHOLDER } from "@/features/news/lib/image-placeholder";
import type { EditorialHome, NewsArticle } from "@/features/news/types";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";
import type { HomePublicListings } from "@/lib/home/public-listings";

type HomeSlide = {
  image: string;
  imageSources?: NewsArticle["imageSources"];
  date: string;
  categories: string[];
  href: string;
};

type FeaturedHomeSlide = HomeSlide & {
  title: string;
};

type SecondaryHomeSlide = HomeSlide & {
  title: string;
  text: string;
};

const heroServices = [
  { href: "/petites-annonces", label: "Minéraux", Icon: Tag, image: "/Annonces.png" },
  { href: "/annuaire", label: "Annuaire", Icon: Mail, image: "/prototype-assets/47b7587af10d29e7ce1f438f34a26475dd52c698.png" },
] as const;

type ServiceCardStyle = CSSProperties & { "--service-card-image": string };

function formatArticleDate(input: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(input));
}

function stripHtml(html: string) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sortArticlesByPublishedAtDesc(articles: NewsArticle[] | undefined | null) {
  return [...(articles ?? [])].sort((left, right) => {
    const leftTime = new Date(left.publishedAt).getTime();
    const rightTime = new Date(right.publishedAt).getTime();
    return rightTime - leftTime;
  });
}

function mapArticleToFeaturedSlide(article: NewsArticle): FeaturedHomeSlide {
  return {
    image: article.imageUrl || NEWS_IMAGE_PLACEHOLDER,
    imageSources: article.imageSources,
    date: formatArticleDate(article.publishedAt),
    categories: [article.categoryLabel || humanizeCategoryLabel(article.category)].filter(Boolean),
    title: article.title,
    href: getEditorialArticlePath(article),
  };
}

function mapArticleToSecondarySlide(article: NewsArticle): SecondaryHomeSlide {
  return {
    image: article.imageUrl || NEWS_IMAGE_PLACEHOLDER,
    date: formatArticleDate(article.publishedAt),
    categories: [article.categoryLabel || humanizeCategoryLabel(article.category)].filter(Boolean),
    title: article.title,
    text: stripHtml(article.excerpt || article.content),
    href: getEditorialArticlePath(article),
  };
}

function EditorialSkeleton() {
  return (
    <div className="mb-6 animate-pulse lg:mb-10">
      <div className="mb-6 sm:mb-8">
        <div className="h-3 w-44 rounded-full bg-[var(--surface-4)]" />
        <div className="mt-3 h-10 w-[min(30rem,82vw)] rounded-[14px] bg-[var(--surface-3)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5 xl:gap-6">
        <div className="h-[596px] rounded-[20px] bg-[var(--surface-4)]" />

        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="h-[220px] rounded-[20px] bg-[var(--surface-3)]" />
          <div>
            <div className="mb-3 h-5 w-40 rounded-full bg-[var(--surface-4)]" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[148px] rounded-[18px] bg-[var(--surface-3)]" />
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 h-5 w-32 rounded-full bg-[var(--surface-4)]" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[85px] rounded-[18px] bg-[var(--surface-3)]" />
            ))}
          </div>
          <div className="mb-3 mt-4 h-5 w-28 rounded-full bg-[var(--surface-4)]" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[85px] rounded-[18px] bg-[var(--surface-3)]" />
            ))}
          </div>
          <div className="mt-4 h-[64px] rounded-[12px] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-2)]" />
        </div>
      </div>
    </div>
  );
}

export function HomeEditorialSection({
  initialEditorial,
  initialListings,
}: {
  initialEditorial: EditorialHome | null;
  initialListings: HomePublicListings | null;
}) {
  const [editorialHome, setEditorialHome] = useState<EditorialHome | null>(initialEditorial);
  const [isLoading, setIsLoading] = useState(initialEditorial === null);

  useEffect(() => {
    if (initialEditorial !== null) {
      return;
    }

    let isMounted = true;

    async function loadEditorialHome() {
      try {
        const response = await fetch("/api/home/editorial");
        const payload = (await response.json()) as EditorialHome & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load editorial home.");
        }

        if (isMounted) {
          setEditorialHome(payload);
        }
      } catch {
        if (isMounted) {
          setEditorialHome(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }


    loadEditorialHome();

    return () => {
      isMounted = false;
    };
  }, [initialEditorial]);

  const featuredStories = useMemo(() => sortArticlesByPublishedAtDesc(editorialHome?.topStories), [editorialHome]);
  const latestStories = useMemo(() => sortArticlesByPublishedAtDesc(editorialHome?.latest), [editorialHome]);
  const featuredSlides = useMemo(() => featuredStories.map(mapArticleToFeaturedSlide), [featuredStories]);
  const olderSlides = useMemo(() => latestStories.map(mapArticleToSecondarySlide).slice(0, 6), [latestStories]);
  const leadStory = featuredSlides[0];
  const leadClassified = initialListings?.classifieds.find((item) => item.image || item.images?.[0]);
  const leadClassifiedImage = leadClassified?.image || leadClassified?.images?.[0] || "/Annonces.png";
  const mosaicSlides = useMemo(
    () => [leadStory, ...olderSlides].filter(Boolean) as Array<FeaturedHomeSlide | SecondaryHomeSlide>,
    [leadStory, olderSlides],
  );
  const [mosaicSlideIndex, setMosaicSlideIndex] = useState(0);

  useEffect(() => {
    if (mosaicSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setMosaicSlideIndex((index) => (index + 1) % mosaicSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [mosaicSlides.length]);
  if (isLoading) {
    return <EditorialSkeleton />;
  }

  if (featuredStories.length === 0) {
    return null;
  }

  return (
    <>
    <section className="home-browse-feature home-bento-page">
      <div className="home-bento-hero">
        <aside className="home-bento-rail">
          {leadStory ? <Link href={leadStory.href} className="home-bento-rail-story">
            <img src={leadStory.image} alt="" />
            <span><b>À LA UNE</b><small>+{Math.max(4, olderSlides.length)} nouveaux articles</small><em>Lire <i>→</i></em></span>
          </Link> : null}
          <Link href={leadClassified ? `/petites-annonces/${leadClassified.id}` : "/petites-annonces"} className="home-bento-rail-story">
            <img src={leadClassifiedImage} alt="" />
            <span><b>TOP ANNONCES</b><small>Les dernières opportunités</small><em>Voir <i>→</i></em></span>
          </Link>
          <Link href="/offres-emploi" className="home-bento-rail-story">
            <img className="home-bento-rail-photo" src="/prototype-assets/cbd3a138766228da19104ba5f969030a180f9fc3.png" alt="" />
            <span><b>TOP EMPLOIS</b><small>Les postes à découvrir</small><em>Voir <i>→</i></em></span>
          </Link>
        </aside>
        <div className="home-bento-headline">
          <p className="ui-section-kicker">TANYORA · TERRE DE DÉCOUVERTES</p>
          <h1><span>Les trésors de <b>»</b></span><span>Madagascar,</span><span><em>à explorer.</em></span></h1>
        </div>
        <aside className="home-bento-intro"><p>Une plateforme pour découvrir les <b>minéraux</b>, partager les savoirs et trouver des <b>livres</b> autour des richesses de Madagascar.</p><Link href="/petites-annonces">Explorer les pièces <ArrowUpRight /></Link><Link href="/annuaire" className="home-bento-primary">Découvrir la communauté <i>→</i></Link></aside>
      </div>

      <section id="home-featured-news" className="home-bento-mosaic" aria-label="Les services Tanyora">
        <div className="home-bento-tile home-bento-new"><p><b>TANYORA</b><span>Minéraux, livres<br/>et découvertes.</span></p></div>
        <Link href="/petites-annonces" className="home-bento-tile home-bento-service-tile home-bento-service-tile--photo home-bento-eye"><img src="/Annonces.png" alt="" /><Newspaper aria-hidden="true" /><span>Annonces</span></Link>
        <section className="home-bento-tile home-bento-photo" aria-label="Actualités à la une">
          <div className="home-bento-ribbon" aria-hidden="true" />
          {mosaicSlides.map((slide, index) => (
            <Link href={slide.href} key={slide.href} className={`home-bento-photo-slide${index === mosaicSlideIndex ? " is-active" : ""}`} aria-hidden={index !== mosaicSlideIndex} tabIndex={index === mosaicSlideIndex ? 0 : -1}>
              <div className="home-bento-photo-copy"><span><Newspaper aria-hidden="true" /> Actualités</span><strong>{slide.title}</strong><i>↗</i></div>
              <img src={slide.image} alt="" />
            </Link>
          ))}
          <div className="home-bento-photo-dots" aria-label={`Actualité ${mosaicSlideIndex + 1} sur ${mosaicSlides.length}`}>{mosaicSlides.map((slide, index) => <i key={slide.href} className={index === mosaicSlideIndex ? "is-active" : ""} />)}</div>
        </section>
        <Link href="/appel-offres" className="home-bento-tile home-bento-service-tile home-bento-service-tile--photo home-bento-star"><img src="/prototype-assets/c37bad47617250953d4216bea025f6c881ea1839.png" alt="" /><FileText aria-hidden="true" /><span>Appels d&apos;offres</span></Link>
        <Link href="/radio" className="home-bento-tile home-bento-service-tile home-bento-service-tile--photo home-bento-radio"><img src="/prototype-assets/a59492c8e2b01d0ad4b7fa48cc8ad33473121174.png" alt="" /><Radio aria-hidden="true" /><span>Web radio</span></Link>
        <Link href="/annuaire" className="home-bento-tile home-bento-service-tile home-bento-service-tile--photo home-bento-headphones"><img src="/prototype-assets/47b7587af10d29e7ce1f438f34a26475dd52c698.png" alt="" /><Mail aria-hidden="true" /><span>Annuaire</span></Link>
        <Link href="/offres-emploi" className="home-bento-tile home-bento-service-tile home-bento-listen"><img src="/images/home/employment-businesswoman.png" alt="Jeune professionnelle malgache" /><i className="home-bento-employment-icon"><BriefcaseBusiness aria-hidden="true" /></i><span>Emploi</span></Link>
      </section>

      <section className="home-ad-placements home-ad-placements--between-sections home-ad-placements--pair" aria-label="Publicités">
        <AdSlot slotKey="homeTop" className="w-full" />
        <AdSlot slotKey="homeSecond" className="w-full" />
      </section>

      <div className="home-four-columns home-bento-content-grid">
        <HomeNewsColumn slides={olderSlides} />
        <HomeMarketplaceSidebar initialItems={initialListings?.classifieds} />
        <HomeTopJobsSidebar initialItems={initialListings?.jobs} />
        <HomeTendersSidebar initialItems={initialListings?.tenders} />
      </div>

    </section>
    <section className="home-bento-services mb-10 lg:mb-14" aria-label="Services essentiels">
      <div className="home-bento-services-bar">
        <a href="#home-popular-services" className="home-bento-services-bar-link">POPULAIRE ↓</a>
        <a href="#home-popular-services" className="home-bento-services-bar-title">Services <i>••</i></a>
        <a href="#home-featured-news" className="home-bento-services-bar-link">À LA UNE ↑</a>
      </div>
      <div className="home-bento-services-title"><h2>Commencez par <sup>02</sup><br/><span>nos services <em>essentiels</em></span></h2><p>Explorez les minéraux et rencontrez les membres de la communauté Tanyora.</p></div>
      <nav id="home-popular-services" className="home-service-cards">
        {heroServices.map(({ href, label, Icon, image }, index) => (
          <Link
            href={href}
            key={href}
            className={`home-service-card home-service-card--${index}`}
            style={{ "--service-card-image": `url("${image}")` } as ServiceCardStyle}
          >
            <span className="home-service-card__thumb" aria-hidden="true"><Icon /></span>
            <span>{label}</span><i><ArrowUpRight /></i>
          </Link>
        ))}
      </nav>
    </section>
    </>
  );
}
