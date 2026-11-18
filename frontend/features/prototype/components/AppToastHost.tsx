"use client";

import { useEffect, useRef, useState } from "react";
import { APP_TOAST_EVENT } from "@/features/prototype/lib/client-toast";

type ToastState = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

export function AppToastHost() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: "success" | "error" | "info"; message?: string }>;
      const message = customEvent.detail?.message?.trim();
      if (!message) return;

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      setToast({
        id: Date.now(),
        type: customEvent.detail?.type || "success",
        message,
      });

      timeoutRef.current = window.setTimeout(() => {
        setToast(null);
      }, 5200);
    };

    window.addEventListener(APP_TOAST_EVENT, onToast as EventListener);
    return () => {
      window.removeEventListener(APP_TOAST_EVENT, onToast as EventListener);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!toast) {
    return null;
  }

  const toneClass =
    toast.type === "error"
      ? "border-[#f5c2c7] bg-[#fff6f6] text-[#7f1d1d]"
      : toast.type === "info"
        ? "border-[#bfdbfe] bg-[#f4f8ff] text-[#1e3a8a]"
        : "border-[#bbf7d0] bg-[#f4fbf6] text-[#14532d]";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200]">
      <div
        key={toast.id}
        className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur ${toneClass}`}
      >
        {toast.message}
      </div>
    </div>
  );
}
