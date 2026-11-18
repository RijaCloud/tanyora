"use client";

type AppToastDetail = {
  type?: "success" | "error" | "info";
  message: string;
};

const APP_TOAST_EVENT = "app-toast";

export function emitAppToast(detail: AppToastDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AppToastDetail>(APP_TOAST_EVENT, { detail }));
}

export function emitSuccessToast(message: string) {
  emitAppToast({ type: "success", message });
}

export { APP_TOAST_EVENT };
