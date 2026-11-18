import svgPaths from "./svg-1knf0muko5";
import { Link } from "@/features/prototype/router-compat";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeftRight, BookOpen, ChevronDown, Mail, Moon, Search, Sun, Tag } from "lucide-react";
import { buildNotificationChannelName, normalizeNotificationUserKey } from "@/lib/notifications/channel";
import { getPusherClientConfig, isPusherClientConfigured } from "@/lib/realtime/pusher-client";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import {
  getNotificationsSnapshot,
  replaceNotifications,
  setNotificationsLoading,
  setNotificationsStoreUser,
  updateNotifications,
  useNotificationsStore,
  type ClientNotification,
} from "@/lib/client/notifications-store";
import { useAuth } from "../app/context/AuthContext";
import { GlobalSearchOverlay, GlobalSearchSuggestions } from "@/features/prototype/components/GlobalSearchOverlay";
import { trackSearchSubmitted } from "@/lib/analytics/ga4";
import { TANYORA_SHOP_VISIBLE } from "@/lib/tanyora-visibility";

type ExchangeRateState = {
  base: string;
  conversionRates: Record<string, number>;
  formattedRates: Record<string, string>;
  updatedAt: string | null;
  error: string | null;
};

type ExchangeRateApiPayload = {
  base?: string;
  conversionRates?: Record<string, number>;
  formattedRates?: Record<string, string>;
  updatedAt?: string | null;
  error?: string;
};

type NotificationApiItem = ClientNotification;

const EXCHANGE_CACHE_TTL_MS = 5 * 60 * 1000;
const NOTIFICATION_BODY_PREVIEW_LIMIT = 120;
// Kept outside the component so a client-side route change cannot reopen the
// submenu under the pointer that initiated navigation.
let dismissedSubmenuAfterNavigation: string | null = null;
const NOTIFICATION_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
};

const exchangeRateCache = new Map<string, { fetchedAt: number; payload: ExchangeRateApiPayload }>();
const exchangeRateInflight = new Map<string, Promise<ExchangeRateApiPayload>>();
const NOTIFICATIONS_POLL_INTERVAL_MS = 60_000;

const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "USA" },
  { code: "EUR", label: "EUR" },
  { code: "GBP", label: "GBP" },
  { code: "AED", label: "AED" },
  { code: "MGA", label: "MGA" },
  { code: "KES", label: "KES" },
] as const;

async function fetchExchangeRatePayload(baseCurrency: string, forceRefresh = false): Promise<ExchangeRateApiPayload> {
  const cacheKey = baseCurrency.toUpperCase();
  const now = Date.now();
  const cached = exchangeRateCache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.fetchedAt < EXCHANGE_CACHE_TTL_MS) {
    return cached.payload;
  }

  const inflight = exchangeRateInflight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const promise = fetch(`/api/exchange-rate?base=${encodeURIComponent(cacheKey)}`, { cache: "force-cache" })
    .then(async (response) => {
      const payload = (await response.json()) as ExchangeRateApiPayload;
      if (!response.ok) {
        throw new Error(payload.error || "Exchange rate request failed.");
      }

      exchangeRateCache.set(cacheKey, { fetchedAt: Date.now(), payload });
      return payload;
    })
    .finally(() => {
      exchangeRateInflight.delete(cacheKey);
    });

  exchangeRateInflight.set(cacheKey, promise);
  return promise;
}

function formatExchangeRateValue(value: number) {
  const absolute = Math.abs(value);
  const fractionDigits = absolute >= 100 ? 2 : absolute >= 1 ? 3 : 4;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatConvertedExchangeValue(value: number, currencyCode: string) {
  const isIntegerCurrency = currencyCode === "MGA";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: isIntegerCurrency ? 0 : 2,
    maximumFractionDigits: isIntegerCurrency ? 0 : 2,
  }).format(value);
}

function parseExchangeInput(value: string) {
  if (!value.trim()) {
    return null;
  }

  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function HeaderFreeUserDropdownIcon({ children }: React.PropsWithChildren<{}>) {


  return (
    <div className="overflow-clip relative shrink-0 size-[12.632px]">
      <div className="absolute inset-[28.63%_10.51%_28.75%_10.51%]" data-name="Group">
        {children}
      </div>
    </div>
  );
}

function HeaderFreeUserHelper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center size-full">
      <div className="content-stretch flex items-center justify-between px-[4px] py-[2px] relative size-full">{children}</div>
    </div>
  );
}

function HeaderFreeUserHelper({ children, hoverScale = true }: React.PropsWithChildren<{ hoverScale?: boolean }>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px] group">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2" data-name="Icon Frame">
        <svg className={`absolute block size-full cursor-pointer ${hoverScale ? "transition-transform duration-300 group-hover:scale-110" : ""}`} fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g id="Icon Frame">{children}</g>
        </svg>
      </div>
    </div>
  );
}
type HeaderFreeUserProps = {
  className?: string;
  property1?: "Dark" | "light";
  logoUrl?: string;
};

const NAVIGATION_ALIASES: Record<string, string[]> = {
  "/exchange": ["/exchange", "/petites-annonces"],
  "/appel-offres": ["/appel-offres", "/appels-offres"],
  "/radio": ["/radio", "/web-radio"],
};

const NAVIGATION_SUBMENU_TONES: Record<string, string> = {
  "/exchange": "marketplace",
  "/boutique": "shop",
  "/annuaire": "directory",
};

function normalizeNavigationPath(path: string) {
  const cleanPath = path.split("?")[0]?.split("#")[0] || "/";
  return cleanPath.length > 1 ? cleanPath.replace(/\/+$/, "") : cleanPath;
}

function normalizeNotificationText(value: string) {
  let output = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  for (const [entity, replacement] of Object.entries(NOTIFICATION_ENTITY_MAP)) {
    output = output.split(entity).join(replacement);
  }

  return output
    .replace(/&#(\d+);/g, (_, codePoint) => {
      const parsed = Number.parseInt(codePoint, 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => {
      const parsed = Number.parseInt(codePoint, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function truncateNotificationBody(body: string) {
  const normalized = normalizeNotificationText(body);
  if (normalized.length <= NOTIFICATION_BODY_PREVIEW_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, NOTIFICATION_BODY_PREVIEW_LIMIT).trimEnd()}...`;
}

function HeaderFreeUser({ className, property1 = "Dark", logoUrl }: HeaderFreeUserProps) {
  const isLight = property1 === "light";
  const router = useRouter();
  const pathname = usePathname();
  const [showPricingDropdown, setShowPricingDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const navigationDialogRef = useRef<HTMLDialogElement>(null);
  const toolsDialogRef = useRef<HTMLDialogElement>(null);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [panelMode, setPanelMode] = useState<"tools" | "account">("tools");
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchOverlayKind, setSearchOverlayKind] = useState<"all" | "article" | "classified" | "job" | "tender" | "directory">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchFormRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [isExchangeRateLoading, setIsExchangeRateLoading] = useState(true);
  const [exchangeAmount, setExchangeAmount] = useState("1");
  const [targetExchangeAmount, setTargetExchangeAmount] = useState("");
  const [lastEditedExchangeField, setLastEditedExchangeField] = useState<"base" | "target">("base");
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState("EUR");
  const [selectedTargetCurrency, setSelectedTargetCurrency] = useState("MGA");
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateState>({
    base: "EUR",
    conversionRates: {},
    formattedRates: {},
    updatedAt: null,
    error: null,
  });
  const notificationsRequestInFlightRef = useRef(false);
  const notificationIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedNotificationsRef = useRef(false);
  const openGlobalSearch = (kind: "all" | "article" | "classified" | "job" | "tender" | "directory" = "all") => {
    setShowMainMenu(false);
    setShowToolsMenu(false);
    setShowPricingDropdown(false);
    setShowNotificationsDropdown(false);
    setSearchOverlayKind(kind);
    setShowSearchSuggestions(false);
    setShowSearchOverlay(true);
  };
  const { isLoggedIn, user, userPlan, userName, setShowLoginModal, logout } = useAuth();
  const accountPlanLabel = user?.accessGrant === "all_privileges" ? "All privileges" : userPlan;
  const accountNameWords = (userName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const mobileAccountName = accountNameWords[0] || userName || "Se connecter";
  const desktopAccountName = accountNameWords.slice(0, 2).join(" ") || userName || "Se connecter";
  const notificationsStore = useNotificationsStore();
  const notifications = notificationsStore.items;
  const notificationsUnreadCount = notificationsStore.unreadCount;
  const isNotificationsLoading = notificationsStore.isLoading;
  const hasLoadedNotifications = notificationsStore.hasLoaded;
  const notificationUserKey = isLoggedIn ? normalizeNotificationUserKey(user?.email || "") : "";
  const canAccessNotifications = isLoggedIn;
  const userInitials = (userName || "MC")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pricingDropdownRef = useRef<HTMLDivElement | null>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement | null>(null);
  const submenuAnchorRef = useRef<HTMLElement | null>(null);
  const unreadMessageCount = notifications.filter((item) => item.isUnread && item.kind === "message").length;
  const currentPath = normalizeNavigationPath(pathname || "/");
  const isHomepage = currentPath === "/";
  const isNavigationItemActive = (href: string) => {
    const candidates = NAVIGATION_ALIASES[href] || [href];
    return candidates.some((candidate) => {
      const normalizedCandidate = normalizeNavigationPath(candidate);
      return currentPath === normalizedCandidate || currentPath.startsWith(`${normalizedCandidate}/`);
    });
  };
  const isPrimaryLinkActive = (href: string) => isNavigationItemActive(href);
  const isAccountLinkActive = (href: string) => {
    if (href === "/profil") {
      return currentPath === "/profil" || currentPath.startsWith("/profil/modifier");
    }

    return isNavigationItemActive(href);
  };
  const [dismissedSubmenu, setDismissedSubmenu] = useState<string | null>(dismissedSubmenuAfterNavigation);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const dismissSubmenuForNavigation = useCallback((itemTo: string) => {
    dismissedSubmenuAfterNavigation = itemTo;
    setDismissedSubmenu(itemTo);
    setOpenSubmenu(null);
  }, []);
  const restoreSubmenuHover = useCallback(() => {
    dismissedSubmenuAfterNavigation = null;
    setDismissedSubmenu(null);
    setOpenSubmenu(null);
  }, []);
  const positionSubmenu = useCallback((anchor: HTMLElement) => {
    submenuAnchorRef.current = anchor;
    document.documentElement.style.setProperty("--site-header-submenu-top", `${anchor.getBoundingClientRect().bottom + 8}px`);
  }, []);

  useEffect(() => {
    if (!openSubmenu) return;

    const repositionSubmenu = () => {
      const anchor = submenuAnchorRef.current;
      if (anchor?.isConnected) positionSubmenu(anchor);
    };

    repositionSubmenu();
    window.addEventListener("scroll", repositionSubmenu, { passive: true });
    window.addEventListener("resize", repositionSubmenu);
    return () => {
      window.removeEventListener("scroll", repositionSubmenu);
      window.removeEventListener("resize", repositionSubmenu);
    };
  }, [openSubmenu, positionSubmenu]);

  useEffect(() => {
    // A destination must never inherit the menu that initiated navigation.
    // Keep the dismissal marker until the pointer leaves its trigger so the
    // submenu cannot immediately reopen beneath the cursor.
    setOpenSubmenu(null);
    document.documentElement.style.removeProperty("--site-header-submenu-top");
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        restoreSubmenuHover();
      }
    };

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".site-header-navigation")) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, [restoreSubmenuHover]);
  const primaryLinks = [
    {
      to: "/exchange", label: "Exchange", detail: "Place de marché des minéraux",
      summary: "Découvrez l'aperçu du futur marché des minéraux Tanyora.", Icon: Tag,
      children: [
        { to: "/exchange", label: "Explorer Exchange", description: "Catalogue de démonstration" },
        { to: "/petites-annonces", label: "Annonces actuelles", description: "Parcourir les annonces existantes" },
      ],
    },
    ...(TANYORA_SHOP_VISIBLE ? [{
      to: "/boutique", label: "Boutique", detail: "Livres sur les minéraux",
      summary: "Explorez les ouvrages sélectionnés par Tanyora.", Icon: BookOpen,
      children: [
        { to: "/boutique", label: "Voir les livres", description: "Parcourir la bibliothèque Tanyora" },
      ],
    }] : []),
    {
      to: "/annuaire", label: "Annuaire", detail: "Experts et laboratoires",
      summary: "Retrouvez les acteurs de la communauté Tanyora.", Icon: Mail,
      children: [
        { to: "/annuaire", label: "Explorer l'annuaire", description: "Découvrir les professionnels" },
      ],
    },
  ];
  const accountLinks = isLoggedIn
      ? [
          { to: "/profil", label: "Mon profil" },
          { to: "/profil/saved", label: "Mes favoris" },
          { to: "/profil/messages", label: "Mes messages", badgeCount: unreadMessageCount > 0 ? unreadMessageCount : undefined },
          { to: "/profil/petites-annonces", label: "Mes annonces" },
        ]
      : [];

  const toggleTheme = () => {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("prototype-theme", nextIsDark ? "dark" : "light");
    setIsDarkMode(nextIsDark);
  };

  useEffect(() => {
    // Check initial dark mode state
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    // Create a MutationObserver to watch for class changes on html element
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      !showPricingDropdown &&
      !showNotificationsDropdown
    ) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pricingDropdownRef.current && !pricingDropdownRef.current.contains(target)) {
        setShowPricingDropdown(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(target)) {
        setShowNotificationsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showPricingDropdown, showNotificationsDropdown]);

  useEffect(() => {
    const syncViewportWidth = () => setViewportWidth(window.innerWidth);
    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth);
    return () => window.removeEventListener("resize", syncViewportWidth);
  }, []);

  useEffect(() => {
    const warmupId = window.setTimeout(() => {
      primaryLinks.forEach((item) => {
        router.prefetch(item.to);
      });
    }, 150);

    return () => window.clearTimeout(warmupId);
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    async function loadExchangeRate(forceRefresh = false) {
      setIsExchangeRateLoading(true);

      try {
        const payload = await fetchExchangeRatePayload(selectedBaseCurrency, forceRefresh);

        if (!isMounted) {
          return;
        }

        setExchangeRate({
          base: payload.base ?? selectedBaseCurrency,
          conversionRates: payload.conversionRates ?? {},
          formattedRates: payload.formattedRates ?? {},
          updatedAt: payload.updatedAt ?? null,
          error: null,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setExchangeRate({
          base: selectedBaseCurrency,
          conversionRates: { MGA: 4532, USD: 1, EUR: 0.87, GBP: 0.75, AED: 3.67, KES: 129.2 },
          formattedRates: { MGA: "4 532", USD: "1", EUR: "1", GBP: "1", AED: "4", KES: "129" },
          updatedAt: null,
          error: getUserFacingErrorMessage(error, "Exchange rate request failed."),
        });
      } finally {
        if (isMounted) {
          setIsExchangeRateLoading(false);
        }
      }
    }

    void loadExchangeRate();
    const refreshId = window.setInterval(() => {
      void loadExchangeRate(true);
    }, EXCHANGE_CACHE_TTL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(refreshId);
    };
  }, [selectedBaseCurrency]);

  const maybeOfferPush = useCallback((items: NotificationApiItem[]) => {
    const nextIds = new Set(items.map((item) => item.id));
    notificationIdsRef.current = nextIds;
    hasLoadedNotificationsRef.current = true;
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!canAccessNotifications || !isLoggedIn || !notificationUserKey) {
      setNotificationsStoreUser("");
      return;
    }

    if (getNotificationsSnapshot().userKey !== notificationUserKey) {
      setNotificationsStoreUser(notificationUserKey);
      notificationIdsRef.current = new Set();
      hasLoadedNotificationsRef.current = false;
    }

    if (notificationsRequestInFlightRef.current) {
      return;
    }

    notificationsRequestInFlightRef.current = true;
    setNotificationsLoading(notificationUserKey, true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { items?: NotificationApiItem[]; unreadCount?: number }
        | null;

      if (!response.ok) {
        throw new Error("Impossible de charger les notifications.");
      }

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      maybeOfferPush(nextItems);
      replaceNotifications(notificationUserKey, nextItems, Number(payload?.unreadCount || 0));
    } catch {
      // Keep the last successful snapshot visible while the next poll retries.
    } finally {
      notificationsRequestInFlightRef.current = false;
      setNotificationsLoading(notificationUserKey, false);
    }
  }, [canAccessNotifications, isLoggedIn, maybeOfferPush, notificationUserKey]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, user?.email]);

  useEffect(() => {
    if (!canAccessNotifications || !isLoggedIn || !user?.email || typeof window === "undefined") {
      return;
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    };
    const refreshId = window.setInterval(refreshWhenVisible, NOTIFICATIONS_POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [canAccessNotifications, isLoggedIn, loadNotifications, user?.email]);

  useEffect(() => {
    function handleNotificationsRefresh() {
      void loadNotifications();
    }

    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("notifications:refresh", handleNotificationsRefresh);
    return () => {
      window.removeEventListener("notifications:refresh", handleNotificationsRefresh);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!canAccessNotifications || !isLoggedIn || !user?.email || !isPusherClientConfigured()) {
      return;
    }

    const { key, cluster } = getPusherClientConfig();
    const channelName = buildNotificationChannelName(normalizeNotificationUserKey(user.email));
    let isSubscribed = true;
    let unsubscribe: (() => void) | null = null;

    void import("pusher-js")
      .then(({ default: Pusher }) => {
        if (!isSubscribed) {
          return;
        }

        const pusher = new Pusher(key, {
          cluster,
          channelAuthorization: {
            endpoint: "/api/realtime/pusher/auth",
            transport: "ajax",
          },
        });

        const channel = pusher.subscribe(channelName);
        channel.bind("notification.created", (payload: { item?: NotificationApiItem; unreadCountDelta?: number }) => {
          const item = payload?.item;
          if (!item?.id) {
            return;
          }

          const nextItems = [item, ...getNotificationsSnapshot().items.filter((entry) => entry.id !== item.id)];
          maybeOfferPush(nextItems);
          updateNotifications(
            () => nextItems,
            nextItems.filter((entry) => entry.isUnread).length,
          );
        });

        unsubscribe = () => {
          channel.unbind_all();
          pusher.unsubscribe(channelName);
          pusher.disconnect();
        };
      })
      .catch(() => undefined);

    return () => {
      isSubscribed = false;
      unsubscribe?.();
    };
  }, [canAccessNotifications, isLoggedIn, maybeOfferPush, user?.email]);

  async function markNotificationAsRead(notificationId: string) {
    if (!notificationId) {
      return;
    }

    const wasUnread = getNotificationsSnapshot().items.some((item) => item.id === notificationId && item.isUnread);
    updateNotifications(
      (current) => current.map((item) => {
        if (item.id !== notificationId) {
          return item;
        }

        return { ...item, isUnread: false };
      }),
      Math.max(0, getNotificationsSnapshot().unreadCount - (wasUnread ? 1 : 0)),
    );

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark-read",
          notificationId,
        }),
      });
    } catch {
      // Silent fail: the optimistic UI is enough for the dropdown.
    }
  }

  async function deleteNotificationItem(notificationId: string) {
    if (!notificationId) {
      return;
    }

    const wasUnread = getNotificationsSnapshot().items.some((item) => item.id === notificationId && item.isUnread);
    updateNotifications(
      (current) => current.filter((item) => item.id !== notificationId),
      Math.max(0, getNotificationsSnapshot().unreadCount - (wasUnread ? 1 : 0)),
    );

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "delete", notificationId }),
      });
    } catch {
      void loadNotifications();
    }
  }

  const shouldShowDesktopNavigation = viewportWidth !== null && viewportWidth >= 1024;
  const shouldShowToolsToggle = true;
  const isResponsiveHeader = viewportWidth !== null && viewportWidth < 768;
  const handleSearchButtonClick = () => {
    if (!shouldShowDesktopNavigation) {
      openGlobalSearch();
      return;
    }

    searchInputRef.current?.focus();
  };
  const selectedTargetRate = exchangeRate.conversionRates[selectedTargetCurrency];
  const parsedBaseExchangeAmount = parseExchangeInput(exchangeAmount);
  const parsedTargetExchangeAmount = parseExchangeInput(targetExchangeAmount);
  const convertedAmount =
    typeof selectedTargetRate === "number" && parsedBaseExchangeAmount !== null
      ? parsedBaseExchangeAmount * selectedTargetRate
      : null;
  const formattedSelectedTargetRate =
    typeof selectedTargetRate === "number" ? formatExchangeRateValue(selectedTargetRate) : null;
  const formattedConvertedAmountFromBase =
    typeof convertedAmount === "number" && Number.isFinite(convertedAmount)
      ? formatConvertedExchangeValue(convertedAmount, selectedTargetCurrency)
      : null;
  const convertedBaseAmount =
    typeof selectedTargetRate === "number" && selectedTargetRate > 0 && parsedTargetExchangeAmount !== null
      ? parsedTargetExchangeAmount / selectedTargetRate
      : null;
  const formattedConvertedBaseAmount =
    typeof convertedBaseAmount === "number" && Number.isFinite(convertedBaseAmount)
      ? formatConvertedExchangeValue(convertedBaseAmount, selectedBaseCurrency)
      : null;

  useEffect(() => {
    if (lastEditedExchangeField !== "base") {
      return;
    }

    if (formattedConvertedAmountFromBase) {
      setTargetExchangeAmount(formattedConvertedAmountFromBase);
      return;
    }

    if (!exchangeAmount.trim()) {
      setTargetExchangeAmount("");
    }
  }, [exchangeAmount, formattedConvertedAmountFromBase, lastEditedExchangeField]);

  useEffect(() => {
    if (lastEditedExchangeField !== "target") {
      return;
    }

    if (formattedConvertedBaseAmount) {
      setExchangeAmount(formattedConvertedBaseAmount);
      return;
    }

    if (!targetExchangeAmount.trim()) {
      setExchangeAmount("");
    }
  }, [formattedConvertedBaseAmount, lastEditedExchangeField, targetExchangeAmount]);

  useEffect(() => {
    // Keep the configured initial EUR -> MGA pair while the rate request is
    // pending. An empty response used to make the first available currency
    // (EUR) replace MGA before the request completed.
    if (Object.keys(exchangeRate.conversionRates).length === 0) {
      return;
    }

    if (selectedTargetCurrency !== selectedBaseCurrency && exchangeRate.conversionRates[selectedTargetCurrency]) {
      return;
    }

    const fallbackTarget =
      selectedBaseCurrency !== "MGA" && exchangeRate.conversionRates.MGA
        ? "MGA"
        : SUPPORTED_CURRENCIES.find((currency) => currency.code !== selectedBaseCurrency)?.code ?? "MGA";
    setSelectedTargetCurrency(fallbackTarget);
  }, [exchangeRate.conversionRates, selectedBaseCurrency, selectedTargetCurrency]);

  useEffect(() => {
    if (shouldShowDesktopNavigation) {
      setShowMainMenu(false);
    }
    if (!shouldShowToolsToggle) {
      setShowToolsMenu(false);
    }
  }, [shouldShowDesktopNavigation, shouldShowToolsToggle]);

  useEffect(() => {
    const dialog = showMainMenu ? navigationDialogRef.current : showToolsMenu ? toolsDialogRef.current : null;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [showMainMenu, showToolsMenu]);

  return (
    <div className={className || "relative w-full min-w-0"}>
      <div className="flex w-full items-center">
        <div className={`site-header-row site-header-row--tanyora${isHomepage ? " site-header-row--homepage" : ""}`}>
          <div className="site-header-brand" data-name="Logo and Navigation">
            <Link
              to="/"
              aria-label="Retour a l'accueil Tanyora"
              title="Retour a l'accueil Tanyora"
              className="relative shrink-0 size-[42px]"
            >
              <img src={logoUrl || "/new-logo.svg?v=tanyora1"} alt="Logo Tanyora" className="block size-full object-contain" />
            </Link>
            <Link to="/" className="site-header-wordmark" aria-label="Tanyora, accueil">TANYORA<span>MINÉRAUX & LIVRES</span></Link>
              <button
                type="button"
                aria-label="Ouvrir la navigation"
                aria-expanded={showMainMenu}
                onClick={() => {
                  setShowToolsMenu(false);
                  setShowPricingDropdown(false);
                  setShowNotificationsDropdown(false);
                  setShowMainMenu((current) => !current);
                }}
                className={`site-header-menu flex h-[42px] w-[42px] items-center justify-center transition-colors ${
                  isDarkMode ? "text-white hover:text-[#27624f]" : "text-[#111111] hover:text-[#27624f]"
                }`}
              >
                <span className="flex flex-col gap-[4px]">
                  <span className={`block h-[1.5px] w-[16px] ${isDarkMode ? "bg-white" : "bg-[#111111]"}`} />
                  <span className={`block h-[1.5px] w-[16px] ${isDarkMode ? "bg-white" : "bg-[#111111]"}`} />
                  <span className={`block h-[1.5px] w-[16px] ${isDarkMode ? "bg-white" : "bg-[#111111]"}`} />
                </span>
              </button>
            <nav className="site-header-navigation site-header-navigation--top" aria-label="Navigation principale">
              {primaryLinks.map((item) => (
                <div
                  key={item.to}
                  className={`site-header-nav-item${dismissedSubmenu === item.to ? " site-header-nav-item--dismissed" : ""}${openSubmenu === item.to ? " site-header-nav-item--open" : ""}`}
                  onMouseEnter={(event) => {
                    if (dismissedSubmenuAfterNavigation === item.to) return;
                    restoreSubmenuHover();
                    setOpenSubmenu(item.to);
                    positionSubmenu(event.currentTarget);
                  }}
                  onMouseLeave={restoreSubmenuHover}
                  onFocus={(event) => {
                    if (dismissedSubmenuAfterNavigation === item.to) return;
                    setOpenSubmenu(item.to);
                    positionSubmenu(event.currentTarget);
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setOpenSubmenu(null);
                    }
                  }}
                >
                  <Link to={item.to} onClick={() => dismissSubmenuForNavigation(item.to)} aria-current={isPrimaryLinkActive(item.to) ? "page" : undefined} className="site-header-link">
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    className="site-header-nav-trigger"
                    aria-label={`Afficher les raccourcis ${item.label}`}
                    aria-expanded={openSubmenu === item.to && dismissedSubmenu !== item.to}
                    onClick={(event) => {
                      dismissedSubmenuAfterNavigation = null;
                      setDismissedSubmenu(null);
                      setOpenSubmenu((current) => current === item.to ? null : item.to);
                      const itemElement = event.currentTarget.parentElement;
                      if (itemElement) {
                        positionSubmenu(itemElement);
                      }
                    }}
                  >
                    <ChevronDown className="site-header-nav-caret" aria-hidden="true" strokeWidth={1.8} />
                  </button>
                  {openSubmenu === item.to && dismissedSubmenu !== item.to ? (
                    <div className="site-header-submenu" data-tone={NAVIGATION_SUBMENU_TONES[item.to]} role="group" aria-label={`Explorer ${item.label}`}>
                      <div className="site-header-submenu-feature">
                        <item.Icon aria-hidden="true" />
                        <div>
                          <p>Explorer {item.label}</p>
                          <span>{item.summary}</span>
                        </div>
                      </div>
                      <div className="site-header-submenu-content">
                        <p className="site-header-submenu-title">Accès rapides</p>
                        <div className="site-header-submenu-links">
                          {item.children.map((child) => (
                            <Link key={child.to} to={child.to} onClick={() => dismissSubmenuForNavigation(item.to)} className="site-header-submenu-link">
                              <span>{child.label}</span><small>{child.description}</small>
                            </Link>
                          ))}
                        </div>
                        <Link to={item.to} onClick={() => dismissSubmenuForNavigation(item.to)} className="site-header-submenu-preview">
                          <span>Voir tout</span><strong>Découvrir {item.label} ↗</strong>
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>
          </div>
          <div className="site-header-actions" role="group" aria-label="Recherche, outils et compte">
          <div className="site-header-utilities" role="group" aria-label="Recherche et outils">
          <form
            ref={searchFormRef}
            className="site-header-search relative"
            onSubmit={(event) => {
              event.preventDefault();
              if (searchQuery.trim()) {
                trackSearchSubmitted("header");
              }
              openGlobalSearch();
            }}
          >
            <button type="button" onClick={handleSearchButtonClick} className="site-header-search-submit" aria-label="Rechercher sur Tanyora">
              <Search aria-hidden="true" strokeWidth={1.8} />
            </button>
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setSearchQuery(nextQuery);
                setShowSearchSuggestions(nextQuery.trim().length >= 2);
              }}
              onFocus={() => setShowSearchSuggestions(searchQuery.trim().length >= 2)}
              className="site-header-search-input"
              aria-label="Rechercher sur Tanyora"
              placeholder="Rechercher sur Tanyora"
              autoComplete="off"
            />
            <GlobalSearchSuggestions
              anchorRef={searchFormRef}
              open={showSearchSuggestions}
              query={searchQuery}
              onClose={() => setShowSearchSuggestions(false)}
              onShowAll={openGlobalSearch}
            />
          </form>
          <div className="site-header-inline-widgets" role="group" aria-label="Convertisseur de devises">
            <div className="site-header-exchange-wrap">
              <button
                type="button"
                className="site-header-exchange-widget"
                aria-label={`Change : 1 ${selectedBaseCurrency} vaut ${formattedSelectedTargetRate ?? "—"} ${selectedTargetCurrency}. Afficher le convertisseur.`}
                aria-controls="header-exchange-popover"
              >
                <span>Change</span>
                <strong>
                  {isExchangeRateLoading || !formattedSelectedTargetRate
                    ? `${selectedBaseCurrency} → ${selectedTargetCurrency}`
                    : `${selectedBaseCurrency} → ${selectedTargetCurrency} · ${formattedSelectedTargetRate}`}
                </strong>
              </button>
              <aside id="header-exchange-popover" className="site-header-exchange-sidebar" aria-label="Convertisseur de devises">
                <p className="site-header-exchange-sidebar-title">Convertisseur</p>
                <div className="site-header-exchange-pair">
                  <select aria-label="Devise de départ" value={selectedBaseCurrency} onChange={(event) => { setLastEditedExchangeField("base"); setSelectedBaseCurrency(event.target.value); }} disabled={isExchangeRateLoading}>
                    {SUPPORTED_CURRENCIES.map((currency) => <option key={`header-base-${currency.code}`} value={currency.code}>{currency.code}</option>)}
                  </select>
                  <span aria-hidden="true">→</span>
                  <select aria-label="Devise d’arrivée" value={selectedTargetCurrency} onChange={(event) => { setLastEditedExchangeField("target"); setSelectedTargetCurrency(event.target.value); }} disabled={isExchangeRateLoading}>
                    {SUPPORTED_CURRENCIES.filter((currency) => currency.code !== selectedBaseCurrency).map((currency) => <option key={`header-target-${currency.code}`} value={currency.code}>{currency.code}</option>)}
                  </select>
                </div>
                <div className="site-header-exchange-amounts">
                  <input type="text" inputMode="decimal" value={exchangeAmount} onChange={(event) => { setLastEditedExchangeField("base"); setExchangeAmount(event.target.value); }} aria-label="Montant à convertir" placeholder="Montant" />
                  <span aria-hidden="true">→</span>
                  <input type="text" inputMode="decimal" value={isExchangeRateLoading ? "" : targetExchangeAmount} onChange={(event) => { setLastEditedExchangeField("target"); setTargetExchangeAmount(event.target.value); }} aria-label="Montant converti" placeholder={isExchangeRateLoading ? "Chargement..." : "Résultat"} />
                </div>
              </aside>
            </div>
          </div>
          {shouldShowToolsToggle ? (
            <button
              type="button"
              aria-label="Ouvrir le convertisseur de devises"
              aria-expanded={showToolsMenu && panelMode === "tools"}
              aria-controls="header-tools-panel"
              onClick={() => {
                setShowMainMenu(false);
                setShowPricingDropdown(false);
                setShowNotificationsDropdown(false);
                setPanelMode("tools");
                setShowToolsMenu((current) => panelMode !== "tools" || !current);
              }}
              className="site-header-tool-button"
            >
              <ArrowLeftRight aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>Devises</span>
              <span aria-hidden="true" className={`site-header-chevron ${showToolsMenu && panelMode === "tools" ? "rotate-180" : ""}`}>⌄</span>
            </button>
          ) : null}
          <button
            type="button"
            className="site-header-icon site-header-theme-toggle group"
            aria-label={isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"}
            aria-pressed={isDarkMode}
            title={isDarkMode ? "Mode clair" : "Mode sombre"}
            onClick={toggleTheme}
          >
            {isDarkMode ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />}
          </button>
          </div>
          <div className="site-header-account" role="group" aria-label="Mon compte" data-name="User and Notifications">
            {canAccessNotifications && !isResponsiveHeader ? (
              <div ref={notificationsDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowPricingDropdown(false);
                    setShowNotificationsDropdown((current) => !current);
                  }}
                  className="site-header-icon site-header-notifications group relative flex items-center justify-center rounded-full p-1 transition-colors"
                >
                  <HeaderFreeUserHelper hoverScale={false}>
                    <g id="Base" />
                    <path className="ui-motion-colors transition-all group-hover:stroke-[#27624f]" d={svgPaths.p4a69b80} id="Vector 166" stroke={isDarkMode ? "white" : "var(--stroke-0, black)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path className="ui-motion-colors transition-all group-hover:stroke-[#27624f]" d="M11 22L13 22" id="Vector 77" stroke={isDarkMode ? "white" : "var(--stroke-0, black)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <circle className="ui-motion-colors transition-all group-hover:stroke-[#27624f]" cx="12" cy="3" id="Ellipse 79" r="1" stroke={isDarkMode ? "white" : "var(--stroke-0, black)"} strokeWidth="2" />
                  </HeaderFreeUserHelper>
                  {notificationsUnreadCount > 0 ? (
                    <span className="absolute right-[2px] top-[2px] inline-flex h-[8px] w-[8px] rounded-full bg-[#27624f]" />
                  ) : null}
                </button>

                {showNotificationsDropdown && (
                  <div className="absolute right-0 top-full z-50 mt-3 w-[320px] overflow-hidden rounded-[18px] border border-[#EAEAEA] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.12)] animate-in fade-in-0 zoom-in-95 duration-300 dark:border-[#3a3a3a] dark:bg-[#222222]">
                    <div className="flex items-center justify-between border-b border-[#EFEFEF] px-4 py-3 dark:border-[#3a3a3a]">
                      <p className="text-sm font-semibold text-[#111111] dark:text-white">Notifications</p>
                      <span className="rounded-full bg-[#27624f]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#27624f]">
                        {notificationsUnreadCount > 0 ? `${notificationsUnreadCount} nouvelle${notificationsUnreadCount > 1 ? "s" : ""}` : "A jour"}
                      </span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {isNotificationsLoading && !hasLoadedNotifications ? (
                        <div className="px-4 py-6 text-[12px] text-[#666666] dark:text-[#c8c8c8]">Chargement des notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-6 text-[12px] text-[#666666] dark:text-[#c8c8c8]">
                          Aucune notification pour le moment.
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const titleText = normalizeNotificationText(item.title);
                          const bodyText = normalizeNotificationText(item.body);
                          const bodyPreview = truncateNotificationBody(item.body);
                          const content = (
                            <>
                              <div className="mb-1 flex items-center justify-between gap-3">
                                <p className="line-clamp-1 min-w-0 text-[12px] font-semibold text-[#111111] dark:text-white">{titleText}</p>
                                <span className="shrink-0 whitespace-nowrap text-[10px] text-[#8a8a8a]">{item.timeLabel}</span>
                              </div>
                              <p
                                className="line-clamp-2 text-[12px] leading-5 text-[#666666] dark:text-[#c8c8c8]"
                                title={bodyText}
                              >
                                {bodyPreview}
                              </p>
                            </>
                          );

                          const className = `block w-full px-4 py-3 pr-11 text-left transition-colors hover:bg-[#fafafa] dark:hover:bg-[#2b2b2b] ${
                            item.isUnread ? "bg-[#fff7f7] dark:bg-[#2c2022]" : ""
                          }`;

                          return (
                            <div
                              key={item.id}
                              className="relative border-b border-[#F3F3F3] last:border-b-0 dark:border-[#303030]"
                            >
                              {item.href ? (
                                <Link
                                  to={item.href}
                                  onClick={() => {
                                    void markNotificationAsRead(item.id);
                                    setShowNotificationsDropdown(false);
                                  }}
                                  className={className}
                                >
                                  {content}
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void markNotificationAsRead(item.id);
                                    setShowNotificationsDropdown(false);
                                  }}
                                  className={className}
                                >
                                  {content}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => void deleteNotificationItem(item.id)}
                                className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center text-lg leading-none text-[#27624f]"
                                aria-label="Supprimer cette notification"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
              <button
                type="button"
                aria-label={isLoggedIn ? "Ouvrir le menu de mon compte" : "Se connecter"}
                onClick={() => {
                  if (isLoggedIn) {
                    if (isResponsiveHeader) {
                      setShowMainMenu(false);
                      setShowPricingDropdown(false);
                      setShowNotificationsDropdown(false);
                      setPanelMode("account");
                      setShowToolsMenu((current) => panelMode !== "account" || !current);
                      return;
                    }
                    setShowNotificationsDropdown(false);
                    setShowPricingDropdown((current) => !current);
                    return;
                  }
                  setShowLoginModal(true);
                }}
                className={`site-header-signin group relative flex flex-row-reverse items-center gap-[8px] ${isLoggedIn ? "site-header-account-chip" : ""} ${isResponsiveHeader ? "rounded-[10px] px-2 py-1.5" : "rounded-full px-3 py-2"} transition-all duration-300 ${
                  isDarkMode
                    ? "bg-[#2a2a2a] text-white"
                    : "bg-white text-[#111111]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 ${isResponsiveHeader ? "rounded-[10px] border border-[#EAEAEA]" : "rounded-full border-[2px]"} transition-colors duration-300 group-hover:border-[#27624f] group-focus-visible:border-[#27624f] ${
                    isDarkMode ? "border-[#3a3a3a]" : "border-[#EAEAEA]"
                  }`}
                />
                {isLoggedIn && user?.picture ? (
                  <img
                    alt={userName}
                    className="site-header-account-avatar relative z-[1] h-8 w-8 rounded-full object-cover"
                    src={user.picture}
                  />
                ) : isLoggedIn ? (
                  <span
                    className={`site-header-account-avatar relative z-[1] flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold uppercase ${
                      isDarkMode ? "bg-white/10 text-white" : "bg-[#111111] text-white"
                    }`}
                  >
                    {userInitials}
                  </span>
                ) : (
                  <div className="site-header-signin-icon relative z-[1]">
                    <HeaderFreeUserHelper>
                    <g id="Base" />
                    <path className="transition-all duration-200 group-hover:stroke-[#27624f]" d={svgPaths.p3c874e00} id="Vector" stroke={isDarkMode ? "white" : "var(--stroke-0, black)"} strokeWidth="2" />
                    <path className="transition-all duration-200 group-hover:stroke-[#27624f]" d={svgPaths.p11503a00} id="Vector_2" stroke={isDarkMode ? "white" : "var(--stroke-4, black)"} strokeWidth="2" />
                    <path className="transition-all duration-200 group-hover:stroke-[#27624f]" d={svgPaths.p3417bd80} id="Vector_3" stroke={isDarkMode ? "white" : "var(--stroke-0, black)"} strokeWidth="2" />
                    </HeaderFreeUserHelper>
                  </div>
                )}
                <div className="site-header-account-copy relative z-[1] hidden min-[426px]:flex flex-col items-start">
                  <p className={`site-header-account-name font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isDarkMode ? "text-white" : "text-black"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    {isLoggedIn ? (
                      <>
                        <span className="min-[768px]:hidden">{mobileAccountName}</span>
                        <span className="hidden min-[768px]:inline">{desktopAccountName}</span>
                      </>
                    ) : "Se connecter"}
                  </p>
                  {isLoggedIn ? (
                    <p className="site-header-account-plan text-[10px] uppercase tracking-[0.12em] text-[#8a8a8a]">
                      {accountPlanLabel}
                    </p>
                  ) : null}
                </div>
              </button>
            </div>
            {isLoggedIn && !isResponsiveHeader ? (
              <div ref={pricingDropdownRef} className="site-header-account-menu-anchor content-stretch flex items-center justify-center relative shrink-0">
                <button
                  onClick={() => {
                    setShowNotificationsDropdown(false);
                    setShowPricingDropdown(!showPricingDropdown);
                  }}
                  className="site-header-account-settings rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <HeaderFreeUserHelper>
                    <g id="Base" />
                    <circle className="transition-all duration-200 group-hover:stroke-[#27624f]" cx="12" cy="12" id="Ellipse 41" r="2" stroke={isDarkMode ? "white" : "var(--stroke-0, black)"} strokeWidth="2" />
                    <path className="transition-all duration-200 group-hover:stroke-[#27624f]" d={svgPaths.pc6bb6f0} id="Vector" stroke={isDarkMode ? "white" : "var(--stroke-0, black)"} strokeLinejoin="round" strokeWidth="2" />
                  </HeaderFreeUserHelper>
                </button>
                
                {/* Dropdown Menu */}
                {showPricingDropdown && (
                  <>
                    {/* Dropdown */}
                    <div className="site-header-account-dropdown absolute top-full right-0 z-50 mt-2 min-w-[220px] rounded-[18px] border border-[#EAEAEA] bg-white py-2 shadow-[0_24px_60px_rgba(0,0,0,0.12)] dark:border-[#3a3a3a] dark:bg-[#222222]">
                      <div className="px-4 py-2">
                        <p className="text-sm font-semibold text-[#111111] dark:text-white">{userName}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#8a8a8a]">Plan {accountPlanLabel}</p>
                      </div>
                      <div className="my-1 h-px bg-[#EAEAEA] dark:bg-[#3a3a3a]" />
                      <Link
                        to="/profil"
                        className="block px-4 py-2 text-sm text-[#1A1A1A] transition-colors duration-200 hover:bg-[#f5f5f5] hover:text-[#27624f] dark:text-white dark:hover:bg-[#2b2b2b]"
                        onClick={() => setShowPricingDropdown(false)}
                      >
                        Mon profil
                      </Link>
                      <div className="my-1 h-px bg-[#EAEAEA] dark:bg-[#3a3a3a]" />
                      <Link
                        to="/profil/saved"
                        className="block px-4 py-2 text-sm text-[#1A1A1A] transition-colors duration-200 hover:bg-[#f5f5f5] hover:text-[#27624f] dark:text-white dark:hover:bg-[#2b2b2b]"
                        onClick={() => setShowPricingDropdown(false)}
                      >
                        Mes favoris
                      </Link>
                      <div className="my-1 h-px bg-[#EAEAEA] dark:bg-[#3a3a3a]" />
                      <Link
                        to="/profil/messages"
                        className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-[#1A1A1A] transition-colors duration-200 hover:bg-[#f5f5f5] hover:text-[#27624f] dark:text-white dark:hover:bg-[#2b2b2b]"
                        onClick={() => setShowPricingDropdown(false)}
                      >
                        <span>Mes messages</span>
                        {unreadMessageCount > 0 ? (
                          <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#27624f] px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                            {unreadMessageCount}
                          </span>
                        ) : null}
                      </Link>
                      <Link
                        to="/profil/petites-annonces"
                        className="block px-4 py-2 text-sm text-[#1A1A1A] transition-colors duration-200 hover:bg-[#f5f5f5] hover:text-[#27624f] dark:text-white dark:hover:bg-[#2b2b2b]"
                        onClick={() => setShowPricingDropdown(false)}
                      >
                        Mes annonces
                      </Link>
                      <div className="my-1 h-px bg-[#EAEAEA] dark:bg-[#3a3a3a]" />
                      <button
                        onClick={() => {
                          setShowPricingDropdown(false);
                          logout();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-[#1A1A1A] transition-colors duration-200 hover:bg-[#f5f5f5] hover:text-red-600 dark:text-white dark:hover:bg-[#2b2b2b]"
                      >
                        Se deconnecter
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </div>
      <button type="button" className="site-header-submenu-scrim" tabIndex={-1} aria-label="Fermer le sous-menu" onClick={restoreSubmenuHover} />
      {!shouldShowDesktopNavigation && showMainMenu ? (
        <dialog ref={navigationDialogRef} aria-label="Navigation" className="site-header-panel site-header-panel-left"
          onCancel={() => setShowMainMenu(false)}
          onClick={(event) => { if (event.target === event.currentTarget && event.clientX > event.currentTarget.getBoundingClientRect().right) setShowMainMenu(false); }}>
          <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-5 dark:border-[#3a3a3a]">
            <p className="font-['Roboto_Flex:Bold',sans-serif] text-[14px] uppercase tracking-[0.22em] text-[#27624f]">Navigation</p>
            <button
              type="button"
              aria-label="Fermer la navigation"
              onClick={() => setShowMainMenu(false)}
              className="p-2 text-[#111111] transition-colors hover:text-[#27624f] dark:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-4">
            {primaryLinks.map((item) => {
              const isActive = isPrimaryLinkActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`border-b border-[#F3F3F3] py-4 text-[14px] transition-colors hover:text-[#27624f] dark:border-[#303030] ${
                    isActive ? "font-semibold text-[#27624f] dark:text-[#27624f]" : "text-[#111111] dark:text-white"
                  }`}
                  onClick={() => setShowMainMenu(false)}
                >
                  <span className="flex items-center justify-between gap-4">
                    {item.label}
                    {isActive ? <span className="h-2 w-2 rounded-full bg-[#27624f]" aria-hidden="true" /> : null}
                  </span>
                </Link>
              );
            })}
          </div>
        </dialog>
      ) : null}
      {showToolsMenu ? (
        <dialog ref={toolsDialogRef} id="header-tools-panel" aria-label={panelMode === "tools" ? "Convertisseur de devises" : "Mon compte"}
          className="site-header-panel site-header-panel-right"
          onCancel={() => setShowToolsMenu(false)}
          onClick={(event) => { if (event.target === event.currentTarget && event.clientX < event.currentTarget.getBoundingClientRect().left) setShowToolsMenu(false); }}>
          <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-5 dark:border-[#3a3a3a]">
            <p className="font-['Roboto_Flex:Bold',sans-serif] text-[14px] uppercase tracking-[0.22em] text-[#27624f]">{panelMode === "tools" ? "Convertisseur" : "Mon compte"}</p>
            <button
              type="button"
              aria-label={panelMode === "tools" ? "Fermer le convertisseur" : "Fermer mon compte"}
              onClick={() => setShowToolsMenu(false)}
              className="p-2 text-[#111111] transition-colors hover:text-[#27624f] dark:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            {panelMode === "tools" ? <div className="flex flex-col gap-3">
              <div className={`rounded-[18px] p-4 ${isDarkMode ? "bg-[#2a2a2a] text-white" : "bg-[#f8f8f8] text-[#111111]"}`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a8a8a]">Change</p>
                <div className={`mt-3 flex items-center gap-2 rounded-[14px] border px-3 py-3 ${isDarkMode ? "border-[#3a3a3a] bg-[#222222]" : "border-[#d9dde4] bg-white"}`}>
                  <select
                    aria-label="Devise de départ"
                    value={selectedBaseCurrency}
                    onChange={(event) => {
                      setLastEditedExchangeField("base");
                      setSelectedBaseCurrency(event.target.value);
                    }}
                    disabled={isExchangeRateLoading}
                    className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] outline-none disabled:cursor-wait ${isDarkMode ? "border-[#3a3a3a] bg-[#222222] text-white" : "border-[#d9dde4] bg-white text-[#111827]"}`}
                  >
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <option key={`tools-base-${currency.code}`} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={exchangeAmount}
                    onChange={(event) => {
                      setLastEditedExchangeField("base");
                      setExchangeAmount(event.target.value);
                    }}
                    className={`w-full bg-transparent text-[14px] outline-none ${isDarkMode ? "text-white placeholder:text-white/40" : "text-[#111827] placeholder:text-[#9CA3AF]"}`}
                    aria-label="Montant à convertir"
                    placeholder="Montant"
                  />
                </div>
                <div className={`mt-3 flex items-center gap-2 rounded-[14px] border px-3 py-3 ${isDarkMode ? "border-[#3a3a3a] bg-[#222222]" : "border-[#d9dde4] bg-white"}`}>
                  <select
                    aria-label="Devise d’arrivée"
                    value={selectedTargetCurrency}
                    onChange={(event) => {
                      setLastEditedExchangeField("target");
                      setSelectedTargetCurrency(event.target.value);
                    }}
                    disabled={isExchangeRateLoading}
                    className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] outline-none disabled:cursor-wait ${isDarkMode ? "border-[#3a3a3a] bg-[#222222] text-white" : "border-[#d9dde4] bg-white text-[#111827]"}`}
                  >
                    {SUPPORTED_CURRENCIES.filter((currency) => currency.code !== selectedBaseCurrency).map((currency) => (
                      <option key={`tools-target-${currency.code}`} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={isExchangeRateLoading ? "" : targetExchangeAmount}
                    onChange={(event) => {
                      setLastEditedExchangeField("target");
                      setTargetExchangeAmount(event.target.value);
                    }}
                    className={`w-full bg-transparent text-[14px] outline-none ${isDarkMode ? "text-white placeholder:text-white/40" : "text-[#111827] placeholder:text-[#9CA3AF]"}`}
                    aria-label="Montant converti"
                    placeholder={isExchangeRateLoading ? "Chargement..." : "Résultat"}
                  />
                </div>
                {!isExchangeRateLoading ? (
                  <p className="mt-2 text-[11px] text-[#b0b0b0]">
                    Taux: 1 {selectedBaseCurrency} = {formattedSelectedTargetRate ?? "4 532"} {selectedTargetCurrency}
                  </p>
                ) : null}
                {exchangeRate.updatedAt ? (
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#b0b0b0]">
                    Maj {new Date(exchangeRate.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                ) : null}
              </div>
            </div> : null}
            {panelMode === "account" && isLoggedIn ? (
              <div className="rounded-[20px] border border-[#EAEAEA] bg-white p-4 dark:border-[#3a3a3a] dark:bg-[#222222]">
                <p className="text-sm font-semibold text-[#111111] dark:text-white">{userName}</p>
              </div>
            ) : null}
            {panelMode === "account" && accountLinks.length > 0 ? (
              <div className="rounded-[20px] border border-[#EAEAEA] bg-white py-2 dark:border-[#3a3a3a] dark:bg-[#222222]">
                {accountLinks.map((item) => {
                  const isActive = isAccountLinkActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-[#f5f5f5] hover:text-[#27624f] dark:hover:bg-[#2b2b2b] ${
                        isActive ? "bg-[#fff1f2] font-semibold text-[#27624f] dark:bg-[#3a1f22] dark:text-[#ff6b73]" : "text-[#111111] dark:text-white"
                      }`}
                      onClick={() => setShowToolsMenu(false)}
                    >
                      <span>{item.label}</span>
                      {item.badgeCount ? (
                        <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#27624f] px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                          {item.badgeCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setShowToolsMenu(false);
                    logout();
                  }}
                  className="block w-full px-4 py-3 text-left text-sm text-[#111111] transition-colors hover:bg-[#f5f5f5] hover:text-[#27624f] dark:text-white dark:hover:bg-[#2b2b2b]"
                >
                  Se deconnecter
                </button>
              </div>
            ) : null}
          </div>
        </dialog>
      ) : null}
      <GlobalSearchOverlay
        open={showSearchOverlay}
        initialKind={searchOverlayKind}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={() => setShowSearchOverlay(false)}
      />
    </div>
  );
}

export default function HeaderFreeUser1({ logoUrl }: Pick<HeaderFreeUserProps, "logoUrl">) {
  return <HeaderFreeUser className="prototype-header-shell relative size-full" property1="light" logoUrl={logoUrl} />;
}
