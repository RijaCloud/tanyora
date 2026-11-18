/**
 * Types and helpers shared by server requests and browser filter controls.
 * This module must remain free of server-only imports.
 */
export type TaxonomyTermResult = {
  id?: number;
  name: string;
  slug: string;
  count: number;
  order?: number;
  parentId?: number;
  parentName?: string;
  parentSlug?: string;
  productTagIds?: number[];
  productTagNames?: string[];
  productTagSlugs?: string[];
  productTagsConfigured?: boolean;
};

export type TaxonomyTermsResult = {
  terms: TaxonomyTermResult[];
  productTags?: TaxonomyTermResult[];
};

function buildTaxonomyHierarchyKey(term: Pick<TaxonomyTermResult, "name" | "parentName">) {
  return `${String(term.parentName || "").trim().toLowerCase()}::${String(term.name || "").trim().toLowerCase()}`;
}

export function dedupeTaxonomyTermsByHierarchy<T extends TaxonomyTermResult>(terms: T[]) {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const term of terms) {
    const key = buildTaxonomyHierarchyKey(term);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(term);
  }

  return deduped;
}
