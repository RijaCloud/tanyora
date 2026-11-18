// @ts-nocheck
"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter } from "next/navigation";
import { startNavigationProgress } from "@/components/navigation/NavigationProgressBar";

type CompatLinkProps = {
  to?: string;
  href?: string;
  className?: string;
  children?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
} & Omit<React.ComponentProps<typeof NextLink>, "href" | "className" | "children" | "onClick">;

export function Link({ to, href, className, children, onClick, ...rest }: CompatLinkProps) {
  const target = href ?? to ?? "#";
  return (
    <NextLink href={target} className={className} onClick={onClick} {...rest}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to: string) => {
    startNavigationProgress();
    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname };
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useNextParams<T>();
}

export function Outlet() {
  return null;
}

export function RouterProvider() {
  return null;
}

export function createBrowserRouter() {
  return null;
}
