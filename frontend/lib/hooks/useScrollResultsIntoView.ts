import { useEffect, useRef } from "react";

export function useScrollResultsIntoView<T extends HTMLElement>(dependencyKey: string, offset = 140) {
  const containerRef = useRef<T | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const node = containerRef.current;
    if (!node) {
      return;
    }

    const targetTop = Math.max(0, node.getBoundingClientRect().top + window.scrollY - offset);
    if (window.scrollY <= targetTop + 12) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    });
  }, [dependencyKey, offset]);

  return containerRef;
}
