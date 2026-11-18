type PushStatus = { configured?: boolean; publicKey?: string | null; enabled?: boolean };

function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { name: typeof error, message: String(error) };
}

function getApplicationServerKey(value: string) {
  const key = base64UrlToUint8Array(value);
  // A VAPID public key is an uncompressed P-256 point: 0x04 + 64 bytes.
  if (key.byteLength !== 65 || key[0] !== 4) {
    throw new Error("Format de clé publique VAPID invalide.");
  }

  return key;
}

export function isWebPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getWebPushStatus(): Promise<PushStatus> {
  const response = await fetch("/api/notifications/push-subscription", { cache: "no-store" });
  return response.ok ? ((await response.json()) as PushStatus) : {};
}

export async function enableWebPush() {
  if (!isWebPushSupported()) throw new Error("Les notifications push ne sont pas prises en charge par ce navigateur.");
  const status = await getWebPushStatus();
  if (!status.configured || !status.publicKey) throw new Error("Les notifications push ne sont pas encore configurees.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { permission, enabled: false };

  const registration = await navigator.serviceWorker.register("/service-worker.js");
  const readyRegistration = await navigator.serviceWorker.ready;
  let applicationServerKey: Uint8Array<ArrayBuffer>;
  try {
    applicationServerKey = getApplicationServerKey(status.publicKey);
  } catch (error) {
    console.error("[web-push] invalid VAPID public key", getErrorDetails(error));
    throw new Error("Les notifications sont temporairement indisponibles. Réessayez plus tard.");
  }

  let subscription: PushSubscription;
  try {
    subscription = await readyRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch (error) {
    console.error("[web-push] push service registration failed", getErrorDetails(error));
    throw new Error("Impossible d'activer les notifications pour le moment. Réessayez plus tard.");
  }

  const response = await fetch("/api/notifications/push-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: unknown } | null;
    const errorMessage = typeof payload?.error === "string" ? payload.error : "Impossible d'enregistrer les notifications push.";
    console.error("[web-push] subscription persistence failed", { status: response.status, error: errorMessage });
    await subscription.unsubscribe();
    throw new Error(errorMessage);
  }
  return { permission, enabled: true, registration };
}

export async function disableWebPush() {
  if (!isWebPushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return true;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await fetch("/api/notifications/push-subscription", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  return true;
}
