import type { AppSessionUser } from "@/lib/auth/session";

export function isEmailVerified(session: AppSessionUser | null | undefined): boolean {
  if (!session) {
    return false;
  }

  return session.emailVerified !== false;
}

export function isEmailVerificationRequired(session: AppSessionUser | null | undefined): boolean {
  return Boolean(session && session.emailVerified === false);
}

