"use client";

import { useEffect } from "react";

type CategoryVisitTrackerProps = {
  slug: string;
  label?: string;
  eventKey: string;
};

export function CategoryVisitTracker({ slug, label, eventKey }: CategoryVisitTrackerProps) {
  useEffect(() => {
    if (!slug) return;

    const sessionKey = `2424:category-view:${eventKey}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/news/categories/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slug, label }),
      signal: controller.signal,
    })
      .then(() => {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(sessionKey, "1");
        }
      })
      .catch(() => {
        // Best-effort analytics in local/dev mode.
      });

    return () => controller.abort();
  }, [eventKey, label, slug]);

  return null;
}
