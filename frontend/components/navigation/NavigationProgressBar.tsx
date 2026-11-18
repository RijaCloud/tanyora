"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const NAVIGATION_START_EVENT = "2424:navigation-start";

export function startNavigationProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
  }
}

function isInternalNavigation(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || anchor.target || anchor.hasAttribute("download")) {
    return false;
  }

  try {
    const target = new URL(href, window.location.href);
    return target.origin === window.location.origin && target.href !== window.location.href;
  } catch {
    return false;
  }
}

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settledRouteRef = useRef(routeKey);

  useEffect(() => {
    const clearTimers = () => {
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };

    const start = () => {
      clearTimers();
      setIsActive(true);
      setProgress(18);
      advanceTimerRef.current = setTimeout(() => setProgress(76), 120);
      safetyTimerRef.current = setTimeout(() => {
        setProgress(100);
        finishTimerRef.current = setTimeout(() => {
          setIsActive(false);
          setProgress(0);
        }, 220);
      }, 10000);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (target instanceof HTMLAnchorElement && isInternalNavigation(target)) {
        start();
      }
    };

    const handlePopState = () => start();

    window.addEventListener(NAVIGATION_START_EVENT, start);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      clearTimers();
      window.removeEventListener(NAVIGATION_START_EVENT, start);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      settledRouteRef.current = routeKey;
      return;
    }

    if (settledRouteRef.current === routeKey) {
      return;
    }

    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    setProgress(100);
    settledRouteRef.current = routeKey;
    finishTimerRef.current = setTimeout(() => {
      setIsActive(false);
      setProgress(0);
      finishTimerRef.current = null;
    }, 220);
  }, [isActive, routeKey]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[201] h-[3px] overflow-hidden">
      <div
        className="h-full bg-[#27624f] transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: isActive ? 1 : 0 }}
      />
    </div>
  );
}
