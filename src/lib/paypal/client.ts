import "server-only";

export class PayPalNotConfiguredError extends Error {
  code = "BILLING_NOT_CONFIGURED";
  constructor() {
    super("Billing isn't configured in this environment. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to enable it.");
  }
}

export function isPayPalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/** https://api-m.sandbox.paypal.com for testing, https://api-m.paypal.com once PAYPAL_ENV=live. */
export function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** OAuth2 client-credentials token — cached until shortly before it expires. */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new PayPalNotConfiguredError();

  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`PayPal OAuth token request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

/** Authenticated fetch against the PayPal REST API — the one place every call goes through. */
export async function paypalRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`PayPal request to ${path} failed (${response.status}): ${body.slice(0, 500)}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
