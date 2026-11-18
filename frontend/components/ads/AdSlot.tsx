"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { useAdSlots } from "@/components/ads/AdSlotProvider";
import { useCookieConsent } from "@/components/privacy/CookieConsentProvider";
import { AD_SLOT_GEOMETRY, type AdSlotKey } from "@/config/ad-slots";

/** Visuel neutre pour l’aperçu d’un emplacement libre. */
const AD_PREVIEW_IMAGE = "/image-placeholder.png";
import type { AdSlotContentType, ResolvedAdItem } from "@/lib/api/wordpress-internal";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    googletag?: {
      cmd: Array<() => void>;
      defineSlot?: (path: string, sizes: unknown, id: string) => { addService: (s: unknown) => unknown } | null;
      pubads?: () => unknown;
      enableServices?: () => void;
      display?: (id: string) => void;
      destroySlots?: (slots: unknown[]) => void;
    };
  }
}

type AdSlotProps = {
  slotKey: AdSlotKey;
  className?: string;
  /** Index de la publicité à rendre pour un emplacement en rotation. */
  index?: number;
};

function AdLabel() {
  return (
    <p className="mt-2 text-center text-[9px] uppercase tracking-[0.22em] text-[var(--text-soft)]">Publicité</p>
  );
}

/** Bannière maison. Servie en first-party, elle n'est pas bloquée. */
function ImageAd({ item }: { item: ResolvedAdItem }) {
  const desktop = item.image?.desktop ?? "";
  if (!desktop) {
    return null;
  }

  const tablet = item.image?.tablet || desktop;
  const mobile = item.image?.mobile || tablet;

  const picture = (
    <picture className="block h-full w-full">
      <source media="(min-width: 1024px)" srcSet={desktop} />
      <source media="(min-width: 640px)" srcSet={tablet} />
      <img
        src={mobile}
        alt={item.altText || item.title || "Publicité"}
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </picture>
  );

  if (!item.linkUrl) {
    return picture;
  }

  return (
    <a
      href={item.linkUrl}
      rel="sponsored noopener"
      target="_blank"
      className="block h-full w-full"
      aria-label={item.altText || item.title || "Publicité"}
    >
      {picture}
    </a>
  );
}

function AdsenseAd({ item, clientId }: { item: ResolvedAdItem; clientId: string }) {
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    const element = insRef.current;
    if (!element || element.dataset.adsbygoogleStatus) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Le script Google peut encore être en cours de chargement.
    }
  }, [item.adsenseSlotId]);

  if (!clientId || !item.adsenseSlotId) {
    return null;
  }

  return (
    <ins
      ref={insRef}
      className="adsbygoogle block w-full"
      data-ad-client={clientId}
      data-ad-slot={item.adsenseSlotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

function GamAd({ item, slotKey }: { item: ResolvedAdItem; slotKey: AdSlotKey }) {
  const containerId = useRef(`gpt-${slotKey}-${item.id}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    const path = item.gamAdUnitPath;
    const elementId = containerId.current;
    if (!path || typeof window === "undefined") {
      return;
    }

    const googletag = (window.googletag = window.googletag || { cmd: [] });
    let definedSlot: unknown = null;

    googletag.cmd.push(() => {
      const slot = googletag.defineSlot?.(path, ["fluid"], elementId);
      if (!slot) {
        return;
      }
      definedSlot = slot;
      const pubads = googletag.pubads?.();
      if (pubads) {
        slot.addService(pubads);
      }
      googletag.enableServices?.();
      googletag.display?.(elementId);
    });

    // Sans destruction au démontage, la navigation côté client accumule des
    // slots fantômes et les emplacements cessent de se remplir.
    return () => {
      googletag.cmd.push(() => {
        if (definedSlot) {
          googletag.destroySlots?.([definedSlot]);
        }
      });
    };
  }, [item.gamAdUnitPath]);

  if (!item.gamAdUnitPath) {
    return null;
  }

  return <div id={containerId.current} className="w-full" />;
}

/**
 * Un tag d'annonceur est du code arbitraire. Il est confiné dans une iframe
 * sans `allow-same-origin` : il ne peut ni lire la session ni modifier la page.
 * C'est aussi la seule façon de l'exécuter — React n'exécute jamais un
 * `<script>` inséré via `dangerouslySetInnerHTML`.
 */
function ScriptAd({ item }: { item: ResolvedAdItem; height: number }) {
  if (!item.scriptCode) {
    return null;
  }

  const document = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;overflow:hidden}</style></head><body>${item.scriptCode}</body></html>`;

  return (
    <iframe
      title={item.title || "Publicité"}
      srcDoc={document}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      className="h-full w-full border-0"
      loading="lazy"
    />
  );
}

function renderByType(
  type: AdSlotContentType,
  item: ResolvedAdItem,
  slotKey: AdSlotKey,
  clientId: string,
  height: number,
) {
  switch (type) {
    case "image":
      return <ImageAd item={item} />;
    case "adsense":
      return <AdsenseAd item={item} clientId={clientId} />;
    case "gam":
      return <GamAd item={item} slotKey={slotKey} />;
    case "script":
      return <ScriptAd item={item} height={height} />;
    default:
      return null;
  }
}

export function AdSlot({ slotKey, className = "", index = 0 }: AdSlotProps) {
  const { mode, showPlaceholders, clientId, isLoaded, getSlot } = useAdSlots();
  const { ready: consentReady, hasConsent } = useCookieConsent();
  const [useFallback, setUseFallback] = useState(false);
  const geometry = AD_SLOT_GEOMETRY[slotKey];
  const placementClassName = [
    geometry.viewportWidth ? "ad-slot-viewport" : "",
    geometry.articleWidth ? "ad-slot-article-inline" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const slot = getSlot(slotKey);
  const items = slot?.items ?? [];
  const normalizedIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  // A rotating placement uses every configured campaign before returning to
  // the first one. Non-rotating placements keep their single highest-priority item.
  const itemIndex = slot?.rotation && items.length > 0 ? normalizedIndex % items.length : 0;
  const item = items[itemIndex] ?? null;

  // Un emplacement Google qui ne se remplit pas — invendu ou bloqueur actif —
  // laisse la place au repli configuré plutôt qu'un trou.
  useEffect(() => {
    setUseFallback(false);
    if (!item?.fallbackType || item.type === "image") {
      return;
    }

    const timer = window.setTimeout(() => setUseFallback(true), 2000);
    return () => window.clearTimeout(timer);
  }, [item?.id, item?.fallbackType, item?.type]);

  // Interrupteur general : coupe toute la regie.
  if (mode === "disabled") {
    return null;
  }

  // Les dimensions saisies dans le gestionnaire l'emportent sur le format par
  // défaut de l'emplacement : c'est la boîte qui s'adapte au visuel, et non
  // l'inverse. Sans elles, on retombe sur le format vendu pour cette position.
  const itemFormat =
    item?.format && item.format.width > 0 && item.format.height > 0 ? item.format : null;
  // Les insertions du corps d'article ont une géométrie éditoriale fixe :
  // une ancienne campagne Sous-Tribune ne doit pas recréer un pavé 300×250.
  const format = geometry.articleWidth ? geometry.format : itemFormat ?? geometry.format;
  const maxWidth = geometry.viewportWidth ? 0 : geometry.articleWidth ? geometry.maxWidth : itemFormat ? itemFormat.width : geometry.maxWidth;

  const frameStyle = {
    "--ad-ratio": `${format.width} / ${format.height}`,
    "--ad-max-w": maxWidth > 0 ? `${maxWidth}px` : "100%",
  } as CSSProperties;

  // Ce qui est configure dans le gestionnaire prime sur le mode global. Une
  // banniere vendue ne doit pas dependre d'un reglage nomme d'apres Google.
  if (item) {
    const type: AdSlotContentType = useFallback && item.fallbackType ? item.fallbackType : item.type;
    const requiresAdvertisingConsent = type === "adsense" || type === "gam" || type === "script";

    // Internal image campaigns remain available; every third-party delivery
    // path waits for the visitor's explicit advertising consent.
    if (requiresAdvertisingConsent && (!consentReady || !hasConsent("advertising"))) {
      if (item.fallbackType === "image") {
        const fallback = renderByType("image", item, slotKey, clientId, format.height);
        if (fallback) {
          return (
            <section className={placementClassName}>
              <div className="ad-slot-frame" style={frameStyle}>{fallback}</div>
              <AdLabel />
            </section>
          );
        }
      }
      return null;
    }

    const content = renderByType(type, item, slotKey, clientId, format.height);

    if (content) {
      return (
        <section className={placementClassName}>
          <div className="ad-slot-frame" style={frameStyle}>
            {content}
          </div>
          <AdLabel />
        </section>
      );
    }
  }

  // Emplacement sans contenu : le mode apercu dessine la position pour la
  // recette, sans contacter aucune regie.
  if (mode === "placeholder" && showPlaceholders && isLoaded) {
    return (
      <section className={placementClassName}>
        <div
          className="ad-slot-frame relative overflow-hidden rounded-[12px] border border-dashed border-[color:var(--border-soft)]"
          style={frameStyle}
        >
          <img
            src={AD_PREVIEW_IMAGE}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <span className="relative z-10 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {slot?.label ?? slotKey}
            <span className="ml-2 opacity-70">{format.width}×{format.height}</span>
          </span>
        </div>
        <AdLabel />
      </section>
    );
  }

  return null;
}
