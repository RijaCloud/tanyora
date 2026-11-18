export function isLikelyGeneratedGravatar(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!host.includes("gravatar.com")) {
      return false;
    }

    const defaultMode = (url.searchParams.get("d") || "").toLowerCase();
    return defaultMode === "mm" || defaultMode === "mp" || defaultMode === "identicon";
  } catch {
    return false;
  }
}

export function resolvePreferredProfilePhoto(
  profilePhoto: string | null | undefined,
  sessionPicture: string | null | undefined,
  authProvider?: "local" | "google",
  avatarUrl?: string | null | undefined,
) {
  if (authProvider === "google" && isLikelyGeneratedGravatar(profilePhoto) && sessionPicture) {
    return sessionPicture;
  }

  return profilePhoto || sessionPicture || avatarUrl || null;
}
