import type { ReactNode } from "react";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getServerSession } from "@/lib/auth/session";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  requireAuthenticatedUser(getServerSession());

  return children;
}
