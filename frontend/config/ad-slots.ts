/**
 * Emplacements publicitaires rendus par le frontend.
 *
 * Le catalogue de référence vit dans le plugin
 * (`platform_2424_ads_get_slots()`) : c'est lui qui porte les libellés affichés
 * dans le gestionnaire de publicités. Ce fichier ne décrit que la géométrie de
 * rendu.
 *
 * Formats issus du kit média : Header 1940×180, Tribune 760×136,
 * Sous-Tribune 300×250. La boîte est réservée à partir du ratio natif, ce qui
 * supprime tout décalage de mise en page au remplissage, et bornée à la largeur
 * du format pour qu'une créa ne soit jamais étirée au-delà de sa taille.
 */

export type AdSlotKey =
  | "topBanner"
  | "homeTop"
  | "homeSecond"
  | "homeAfterJobs"
  | "homeTopics"
  | "newsInline"
  | "newsSectionBreak"
  | "newsRail"
  | "articleInline"
  | "listingBoost"
  | "listingInline";

export type AdSlotGeometry = {
  /** Format natif de la créa, en pixels. */
  format: { width: number; height: number };
  /** Largeur maximale rendue. `0` = pleine largeur du conteneur. */
  maxWidth: number;
  /** Charger au défilement plutôt qu'immédiatement. */
  lazy: boolean;
  /** L'emplacement sort volontairement de la grille éditoriale. */
  viewportWidth?: boolean;
  /** L'emplacement élargit la colonne de lecture sans atteindre le viewport. */
  articleWidth?: boolean;
};

/** Header — pleine largeur, tout en haut de la page. */
const HEADER = { width: 1940, height: 180 };
/** Tribune — bandeau horizontal dans la colonne principale. */
const TRIBUNE = { width: 760, height: 136 };
/** Sous-Tribune — pavé rectangulaire dans le parcours de lecture. */
const SOUS_TRIBUNE = { width: 300, height: 250 };
/** Bandeau Google adapté à la colonne élargie des articles. */
const ARTICLE_INLINE = { width: 726, height: 90 };

export const AD_SLOT_GEOMETRY: Record<AdSlotKey, AdSlotGeometry> = {
  topBanner: { format: HEADER, maxWidth: 0, lazy: false },
  homeTop: { format: TRIBUNE, maxWidth: TRIBUNE.width, lazy: false },
  // Same horizontal format as the first home placement to keep the feed rhythm.
  homeSecond: { format: TRIBUNE, maxWidth: TRIBUNE.width, lazy: false },
  homeAfterJobs: { format: TRIBUNE, maxWidth: TRIBUNE.width, lazy: true },
  homeTopics: { format: SOUS_TRIBUNE, maxWidth: SOUS_TRIBUNE.width, lazy: true },
  newsInline: { format: TRIBUNE, maxWidth: TRIBUNE.width, lazy: true },
  // Emplacement pleine largeur répété après chaque paire de rubriques.
  newsSectionBreak: { format: TRIBUNE, maxWidth: 0, lazy: true, viewportWidth: true },
  newsRail: { format: SOUS_TRIBUNE, maxWidth: SOUS_TRIBUNE.width, lazy: true },
  articleInline: { format: ARTICLE_INLINE, maxWidth: ARTICLE_INLINE.width, lazy: true, articleWidth: true },
  listingBoost: { format: TRIBUNE, maxWidth: TRIBUNE.width, lazy: true },
  listingInline: { format: TRIBUNE, maxWidth: TRIBUNE.width, lazy: true },
};

export const AD_SLOT_KEYS = Object.keys(AD_SLOT_GEOMETRY) as AdSlotKey[];
