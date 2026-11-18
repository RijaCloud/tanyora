export function normalizeNotificationUserKey(value: string): string {
  return String(value || "").trim().toLowerCase();
}

export function buildNotificationChannelName(userKey: string): string {
  const normalized = normalizeNotificationUserKey(userKey).replace(/[^a-z0-9_.=@,;-]/g, "-");
  return `private-notifications-${normalized}`;
}
