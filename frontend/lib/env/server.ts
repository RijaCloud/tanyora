function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value.trim();
}

export function getApiGatewayBaseUrl() {
  return requiredEnv("API_GATEWAY_BASE_URL").replace(/\/$/, "");
}

export function getApiGatewayPath(envName: string, fallbackPath: string) {
  const configured = process.env[envName]?.trim();
  const value = configured && configured.length > 0 ? configured : fallbackPath;

  if (!value.startsWith("/")) {
    return `/${value}`;
  }

  return value;
}

export function getApiGatewayUrl(envName: string, fallbackPath: string) {
  return `${getApiGatewayBaseUrl()}${getApiGatewayPath(envName, fallbackPath)}`;
}
