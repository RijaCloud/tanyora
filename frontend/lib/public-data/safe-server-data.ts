export type PublicDataState<T> = {
  data: T;
  available: boolean;
};

/** Keeps an independent public-page zone renderable when its upstream service fails. */
export async function loadPublicData<T>(loader: () => Promise<T>, fallback: T): Promise<PublicDataState<T>> {
  try {
    return { data: await loader(), available: true };
  } catch {
    return { data: fallback, available: false };
  }
}
