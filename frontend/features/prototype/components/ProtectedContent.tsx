// @ts-nocheck
"use client";

interface ProtectedContentProps {
  children: React.ReactNode;
}

export function ProtectedContent({ children }: ProtectedContentProps) {
  return <div className="relative">{children}</div>;
}
