"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

type ResponsiveImageSource = {
  url: string;
  width: number;
  height?: number;
};

type AppImageProps = ComponentPropsWithoutRef<"img"> & {
  defer?: boolean;
  eager?: boolean;
  fallbackSrc?: string;
  responsiveSources?: readonly ResponsiveImageSource[];
  withLoader?: boolean;
  wrapperClassName?: string;
};

const DEFAULT_FALLBACK_SRC = "/image-placeholder.png";
const IMAGE_LOAD_AHEAD_MARGIN = "250px 0px";

export function AppImage({
  defer = false,
  eager = false,
  loading,
  decoding,
  fetchPriority,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  onError,
  onLoad,
  responsiveSources,
  withLoader = false,
  wrapperClassName,
  className,
  srcSet,
  ...props
}: AppImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const isDeferred = defer && !eager;
  const [shouldLoad, setShouldLoad] = useState(!isDeferred);
  const [loadedSource, setLoadedSource] = useState<string>();
  const [failedSource, setFailedSource] = useState<string>();
  const originalSrc = props.src || fallbackSrc;
  const usesFallback = failedSource === originalSrc;
  const activeSrc = shouldLoad ? (usesFallback ? fallbackSrc : originalSrc) : undefined;
  const isLoaded = activeSrc !== undefined && loadedSource === activeSrc;
  const generatedSrcSet = shouldLoad && !usesFallback && responsiveSources?.length
    ? responsiveSources.map((source) => `${source.url} ${source.width}w`).join(", ")
    : undefined;

  useEffect(() => {
    if (!isDeferred) {
      setShouldLoad(true);
      return;
    }

    const target = imageRef.current;

    if (!target || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: IMAGE_LOAD_AHEAD_MARGIN },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isDeferred]);

  useEffect(() => {
    const image = imageRef.current;
    if (activeSrc && image?.complete && image.naturalWidth > 0) {
      setLoadedSource(activeSrc);
    }
  }, [activeSrc]);

  const handleLoad: NonNullable<ComponentPropsWithoutRef<"img">["onLoad"]> = (event) => {
    if (activeSrc) {
      setLoadedSource(activeSrc);
    }
    onLoad?.(event);
  };

  const handleError: NonNullable<ComponentPropsWithoutRef<"img">["onError"]> = (event) => {
    onError?.(event);

    if (!usesFallback && originalSrc !== fallbackSrc) {
      setFailedSource(originalSrc);
      return;
    }

    // A broken fallback should not leave a permanent loading state.
    event.currentTarget.style.opacity = "0";
    if (activeSrc) {
      setLoadedSource(activeSrc);
    }
  };

  const image = (
    <img
      {...props}
      ref={imageRef}
      src={activeSrc}
      srcSet={generatedSrcSet ?? srcSet}
      onError={handleError}
      onLoad={handleLoad}
      className={className}
      loading={eager ? "eager" : loading ?? "lazy"}
      decoding={eager ? decoding ?? "sync" : decoding ?? "async"}
      fetchPriority={eager ? fetchPriority ?? "high" : fetchPriority}
    />
  );

  if (!withLoader || !isDeferred) {
    return image;
  }

  return (
    <span className={`relative isolate block ${wrapperClassName ?? "h-full w-full"}`} aria-busy={!isLoaded}>
      {!isLoaded ? <span aria-hidden="true" className="absolute inset-0 z-0 animate-pulse bg-[var(--surface-2)]" /> : null}
      {image}
    </span>
  );
}
