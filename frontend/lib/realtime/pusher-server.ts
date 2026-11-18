import Pusher from "pusher";

function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function isPusherConfigured() {
  return Boolean(
    readEnv("PUSHER_APP_ID") &&
      readEnv("PUSHER_KEY") &&
      readEnv("PUSHER_SECRET") &&
      readEnv("PUSHER_CLUSTER"),
  );
}

let singleton: Pusher | null = null;

export function getPusherServer() {
  if (!isPusherConfigured()) {
    throw new Error("Pusher server is not configured.");
  }

  if (!singleton) {
    singleton = new Pusher({
      appId: readEnv("PUSHER_APP_ID"),
      key: readEnv("PUSHER_KEY"),
      secret: readEnv("PUSHER_SECRET"),
      cluster: readEnv("PUSHER_CLUSTER"),
      useTLS: true,
    });
  }

  return singleton;
}
