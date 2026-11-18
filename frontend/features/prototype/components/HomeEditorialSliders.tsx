"use client";

import { memo, useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { FeaturedNewsCard } from "@/features/prototype/components/FeaturedNewsCard";
import { SecondaryCard } from "@/features/prototype/components/SecondaryCard";
import { SectionHeading } from "@/features/prototype/components/SectionHeading";
import type { NewsArticle } from "@/features/news/types";

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

type HomeEditorialSlidersProps = {
  featuredSlides: FeaturedHomeSlide[];
  olderSlides: SecondaryHomeSlide[];
};

function HomeEditorialArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Voir la slide précédente" : "Voir la slide suivante"}
      onClick={onClick}
      className={`home-editorial-arrow home-editorial-arrow--${direction}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === "prev" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

export function HomeEditorialSliders({
  featuredSlides,
  olderSlides,
}: HomeEditorialSlidersProps) {
  const sliderSettings = {
    dots: true,
    infinite: featuredSlides.length > 1,
    speed: 500,
    fade: true,
    cssEase: "ease-in-out",
    swipe: true,
    draggable: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    arrows: true,
    pauseOnHover: true,
    prevArrow: <HomeEditorialArrow direction="prev" />,
    nextArrow: <HomeEditorialArrow direction="next" />,
  };

  return (
    <div className="home-browse-editorial">
      <div>
        <div className="prototype-home-slider prototype-home-slider--featured">
          <Slider {...sliderSettings}>
            {featuredSlides.map((slide) => (
              <div key={slide.href}>
                <FeaturedNewsCard
                  large
                  image={slide.image}
                  imageSources={slide.imageSources}
                  date={slide.date}
                  categories={slide.categories}
                  title={slide.title}
                  href={slide.href}
                  className="home-browse-feature-card"
                />
              </div>
            ))}
          </Slider>
        </div>
      </div>
      <aside className="home-hero-latest" aria-label="Dernières actualités">
        {olderSlides.slice(0, 3).map((slide, index) => (
          <SecondaryCard
            key={slide.href}
            image={slide.image}
            date={slide.date}
            categories={slide.categories}
            title={slide.title}
            text={slide.text}
            href={slide.href}
            variant={index % 2 === 0 ? "cream" : "rose"}
          />
        ))}
      </aside>
    </div>
  );
}

export const HomeNewsColumn = memo(function HomeNewsColumn({ slides }: { slides: SecondaryHomeSlide[] }) {
  const displayCount = Math.min(3, slides.length);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setStartIndex(0);
    if (slides.length <= displayCount) return;

    const timer = window.setInterval(() => {
      setStartIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [displayCount, slides.length]);

  const visibleSlides = Array.from(
    { length: displayCount },
    (_, offset) => slides[(startIndex + offset) % slides.length],
  );

  return (
    <section className="home-four-column__news">
      <SectionHeading title="Actualités" href="/actualites" />
      <div className="home-four-column__news-scroll">
        {visibleSlides.map((slide, offset) => (
          <div className="home-four-column__news-slide" key={`${startIndex}-${slide.href}`}>
            <SecondaryCard {...slide} variant={(startIndex + offset) % 2 === 0 ? "cream" : "rose"} />
          </div>
        ))}
      </div>
    </section>
  );
});
