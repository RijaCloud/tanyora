"use client";

import { useEffect, useState } from "react";
import Slider from "react-slick";
import type { PublicAdItem, PublicAdPlacement } from "@/lib/api/wordpress-internal";

type PublicAdBannerRowProps = {
  placement?: PublicAdPlacement;
  className?: string;
  limit?: number;
};

function renderAdCard(ad: PublicAdItem, extraClassName = "") {
  const image = (
    <img
      src={ad.imageUrl}
      alt={ad.altText || ad.title || "Publicité Tanyora"}
      loading="lazy"
      className="h-full w-full object-contain"
    />
  );

  const cardClassName = `relative aspect-[900/232] w-full overflow-hidden rounded-[12px] bg-black ${extraClassName}`.trim();

  if (ad.linkUrl) {
    return (
      <a href={ad.linkUrl} className={cardClassName}>
        {image}
      </a>
    );
  }

  return <div className={cardClassName}>{image}</div>;
}

export default function PublicAdBannerRow({
  placement = "boost_list",
  className = "",
  limit,
}: PublicAdBannerRowProps) {
  const [ads, setAds] = useState<PublicAdItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAds = async () => {
      try {
        const response = await fetch(`/api/public/ads?placement=${encodeURIComponent(placement)}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        setAds(response.ok && Array.isArray(payload?.items) ? payload.items : []);
      } catch {
        if (!cancelled) {
          setAds([]);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    loadAds();
    return () => {
      cancelled = true;
    };
  }, [placement]);

  const visibleAds = (typeof limit === "number" ? ads.slice(0, limit) : ads).filter((ad) => ad.imageUrl);
  const shouldScroll = visibleAds.length > 3;

  if (!isReady || visibleAds.length === 0) {
    return null;
  }

  return (
    <div className={`content-stretch relative flex w-full shrink-0 flex-col items-start gap-[16px] pt-[32px] ${className}`}>
      <div
        className="ui-text-soft flex w-full shrink-0 flex-col justify-center text-[12px] font-bold uppercase leading-[normal]"
        style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}
      >
        <p className="leading-[1.4]">PUBLICITÉ</p>
      </div>

      {shouldScroll ? (
        <div className="w-full min-w-0">
          <Slider
            arrows={false}
            autoplay
            autoplaySpeed={2600}
            cssEase="ease"
            dots={false}
            draggable
            infinite
            pauseOnFocus
            pauseOnHover
            responsive={[
              {
                breakpoint: 1024,
                settings: {
                  slidesToShow: 2,
                  slidesToScroll: 2,
                },
              },
              {
                breakpoint: 640,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                },
              },
            ]}
            slidesToScroll={3}
            slidesToShow={3}
            speed={700}
            swipe
          >
            {visibleAds.map((ad) => (
              <div key={ad.id} className="px-[7px]">
                {renderAdCard(ad)}
              </div>
            ))}
          </Slider>
        </div>
      ) : (
        <div className="flex w-full flex-col items-start gap-[14px] md:flex-row">
          {visibleAds.map((ad) => (
            <div key={ad.id} className="w-full md:flex-1">
              {renderAdCard(ad)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
