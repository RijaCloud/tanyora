"use client";

import { useEffect, useState, type ReactNode } from "react";
import Slider from "react-slick";

type SponsoredSliderProps<T> = {
  leading?: ReactNode;
  leadingClassName?: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  minItemsToAutoplay?: number;
  singleStepBreakpoint?: number;
  className?: string;
};

function ArrowButton({
  direction,
  onClick,
  className = "",
}: {
  direction: "prev" | "next";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Défiler vers la gauche" : "Défiler vers la droite"}
      onClick={onClick}
      className={`sponsored-slider-arrow sponsored-slider-arrow--${direction} ${className}`.trim()}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
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

export default function SponsoredSlider<T>({
  leading,
  leadingClassName = "",
  items,
  renderItem,
  minItemsToAutoplay = 6,
  singleStepBreakpoint = 768,
  className = "",
}: SponsoredSliderProps<T>) {
  const [isHydrated, setIsHydrated] = useState(false);
  const canSlide = items.length > 4;
  const canAutoplay = items.length >= minItemsToAutoplay;
  const slides = items.map((item, index) => (
    <div key={index} className="sponsored-slider-slide">
      {renderItem(item, index)}
    </div>
  ));

  // react-slick derives part of its DOM from browser layout. Rendering a
  // deterministic rail first keeps server and client HTML identical; the
  // interactive carousel mounts immediately after hydration.
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div className={`flex w-full items-start gap-[14px] ${className}`}>
      {leading ? <div className={`shrink-0 ${leadingClassName}`.trim()}>{leading}</div> : null}

      <div className="sponsored-slider-shell group/sponsored-slider min-w-0 flex-1">
        {isHydrated ? (
          <Slider
            className="sponsored-slider-track"
            arrows={canSlide}
            autoplay={canAutoplay}
            autoplaySpeed={2200}
            cssEase="ease"
            draggable
            focusOnSelect={false}
            infinite={canSlide}
            nextArrow={<ArrowButton direction="next" />}
            pauseOnFocus
            pauseOnHover
            prevArrow={<ArrowButton direction="prev" />}
            slidesToScroll={1}
            responsive={[
              {
                breakpoint: singleStepBreakpoint,
                settings: {
                  slidesToScroll: 1,
                  speed: 500,
                },
              },
            ]}
            speed={850}
            swipe
            swipeToSlide
            variableWidth
          >
            {slides}
          </Slider>
        ) : (
          <div className="flex min-w-0 gap-[14px] overflow-hidden">{slides}</div>
        )}
      </div>
    </div>
  );
}
