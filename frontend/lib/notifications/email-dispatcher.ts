import { getWordPressEmailDispatcherConfig } from "@/lib/api/wordpress-internal";

type EmailAddress = {
  email: string;
  name?: string;
};

type EmailDispatchPayload = {
  eventName: string;
  recipient?: EmailAddress;
  recipients?: EmailAddress[];
  templateData?: Record<string, unknown>;
  subject?: string;
  html?: string;
  text?: string;
  metadata?: Record<string, string>;
};

type EmailDispatchResult = {
  ok: boolean;
  status?: number;
  message?: string;
};

function getEmailDispatcherTimeoutMs() {
  const rawValue = process.env.EMAIL_DISPATCHER_TIMEOUT_MS?.trim();
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : NaN;
  if (Number.isFinite(parsed) && parsed >= 1000) {
    return parsed;
  }

  return 8000;
}

type EmailDispatcherConfig = {
  endpoint: string;
  sharedSecret: string;
};

const EMAIL_DISPATCHER_CONFIG_TTL_MS = 5 * 60 * 1000;

let cachedEmailDispatcherConfig: EmailDispatcherConfig | null = null;
let cachedEmailDispatcherConfigAt = 0;

function getEnvEmailDispatcherConfig(): EmailDispatcherConfig | null {
  const endpoint = process.env.EMAIL_DISPATCHER_LAMBDA_URL?.trim();
  const sharedSecret = process.env.EMAIL_DISPATCHER_SHARED_SECRET?.trim();

  if (!endpoint || !sharedSecret) {
    return null;
  }

  return {
    endpoint,
    sharedSecret,
  };
}

async function getEmailDispatcherConfig(): Promise<EmailDispatcherConfig | null> {
  const envConfig = getEnvEmailDispatcherConfig();
  if (envConfig) {
    return envConfig;
  }

  if (cachedEmailDispatcherConfig && Date.now() - cachedEmailDispatcherConfigAt < EMAIL_DISPATCHER_CONFIG_TTL_MS) {
    return cachedEmailDispatcherConfig;
  }

  try {
    const wordpressConfig = await getWordPressEmailDispatcherConfig();
    const endpoint = String(wordpressConfig.endpoint || "").trim();
    const sharedSecret = String(wordpressConfig.sharedSecret || "").trim();

    if (!wordpressConfig.configured || !endpoint || !sharedSecret) {
      cachedEmailDispatcherConfig = null;
      cachedEmailDispatcherConfigAt = Date.now();
      return null;
    }

    cachedEmailDispatcherConfig = {
      endpoint,
      sharedSecret,
    };
    cachedEmailDispatcherConfigAt = Date.now();
    return cachedEmailDispatcherConfig;
  } catch (error) {
    console.error("[email-dispatcher] unable to load dispatcher configuration from WordPress", {
      message: error instanceof Error ? error.message : String(error),
    });
    cachedEmailDispatcherConfig = null;
    cachedEmailDispatcherConfigAt = Date.now();
    return null;
  }
}

export async function dispatchEmail(payload: EmailDispatchPayload): Promise<EmailDispatchResult> {
  const config = await getEmailDispatcherConfig();
  if (!config) {
    console.error("[email-dispatcher] missing configuration", {
      eventName: payload.eventName,
      hasEndpoint: Boolean(process.env.EMAIL_DISPATCHER_LAMBDA_URL?.trim()),
      hasSharedSecret: Boolean(process.env.EMAIL_DISPATCHER_SHARED_SECRET?.trim()),
    });
    return {
      ok: false,
      message: "EMAIL_DISPATCHER_LAMBDA_URL/EMAIL_DISPATCHER_SHARED_SECRET absents, envoi ignore.",
    };
  }

  const controller = new AbortController();
  const timeoutMs = getEmailDispatcherTimeoutMs();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-2424-email-secret": config.sharedSecret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[email-dispatcher] request failed", {
        eventName: payload.eventName,
        endpoint: config.endpoint,
        status: response.status,
        body: errorBody,
      });
      return {
        ok: false,
        status: response.status,
        message: `Email dispatcher error (${response.status}): ${errorBody}`,
      };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Erreur inconnue lors de l'appel email dispatcher.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
