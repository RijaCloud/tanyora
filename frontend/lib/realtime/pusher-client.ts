export function getPusherClientConfig() {
  return {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY?.trim() || process.env.PUSHER_KEY?.trim() || "",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim() || process.env.PUSHER_CLUSTER?.trim() || "",
  };
}

export function isPusherClientConfigured() {
  const config = getPusherClientConfig();
  return Boolean(config.key && config.cluster);
}
