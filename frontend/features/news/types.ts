export type NewsImageSource = {
  url: string;
  width: number;
  height?: number;
};

export type NewsArticle = {
  id: string;
  postId?: number;
  /** `post` is the editorial WordPress post; `news` is the flash-news CPT. */
  source: "post" | "news";
  slug: string;
  /** Linked flash items retain their own CPT entry but open this canonical article. */
  flashSourcePostId?: number;
  flashSourceSlug?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  categoryLabel?: string;
  categoryUri?: string;
  publishedAt: string;
  modifiedAt?: string;
  isPremium: boolean;
  isPaid?: boolean;
  previewParagraphs?: number;
  previewSpaces?: number;
  commentCount?: number;
  viewCount?: number;
  commentsOpen?: boolean;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageSources?: NewsImageSource[];
  tags?: string[];
  tagSlugs?: string[];
  authorName?: string;
  authorSlug?: string;
  authorUri?: string;
  minimumPlanRequired?: "all" | "essentiel" | "business";
};

export type EditorialHome = {
  /** Categorie "une" : la bande principale de la page d'accueil. */
  topStories: NewsArticle[];
  /** Suite de la categorie "une", pour le carrousel secondaire. */
  latest: NewsArticle[];
  /** Categorie "actualite" : le fil info continu de la colonne de droite. */
  newsfeed: NewsArticle[];
};

export type NewsCollectionPageResult = {
  articles: NewsArticle[];
  pagination: {
    page: number;
    perPage: number;
    hasNextPage: boolean;
  };
  access?: {
    isLimited: boolean;
    visibleArticleCount?: number;
    message?: string;
    actionLabel?: string;
    actionHref?: string;
  };
};

export type NewsEditorialSection = {
  key: string;
  title: string;
  articles: NewsArticle[];
};

export type NewsCategoryStat = {
  slug: string;
  label: string;
  views: number;
};
