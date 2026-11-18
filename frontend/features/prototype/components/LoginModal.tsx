"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AuthPanel } from "@/features/auth/components/AuthPanel";
import { useAuth } from "@/features/prototype/app/context/AuthContext";

export function LoginModal() {
  const { showLoginModal, setShowLoginModal } = useAuth();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isAuthPage = pathname === "/login" || pathname === "/signin";

  const handleClose = useCallback(() => {
    setShowLoginModal(false);
  }, [setShowLoginModal]);

  useEffect(() => {
    if (isAuthPage && showLoginModal) handleClose();
  }, [isAuthPage, showLoginModal, handleClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!showLoginModal || isAuthPage || !dialog) return;

    // Keep the underlying route intact: switching to /login makes Next's
    // pathname update and incorrectly closes this modal as an auth page.
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [showLoginModal, isAuthPage]);

  if (!showLoginModal || isAuthPage) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Connexion ou création de compte Tanyora"
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto border-0 bg-transparent p-0 text-inherit backdrop:bg-black/70"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      data-login-modal
    >
      <div
        className="flex min-h-full items-center justify-center px-4 py-6"
        onClick={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
      >
        <div className="relative my-auto w-full max-w-md rounded-[20px]">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#111111] shadow-lg hover:bg-gray-100"
            aria-label="Fermer la connexion"
          >
            <X size={24} />
          </button>
          <AuthPanel mode="modal" onClose={handleClose} />
        </div>
      </div>
    </dialog>
  );
}
