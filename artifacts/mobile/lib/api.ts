export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const replitDomain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  const candidate =
    configured || (replitDomain ? `https://${replitDomain}` : "");

  if (!candidate) {
    if (__DEV__) return "http://localhost:3000";
    throw new Error("EXPO_PUBLIC_API_URL is required for release builds");
  }

  const parsed = new URL(candidate);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("EXPO_PUBLIC_API_URL must use HTTPS");
  }
  if (!__DEV__ && parsed.protocol !== "https:") {
    throw new Error("EXPO_PUBLIC_API_URL must use HTTPS in release builds");
  }

  return candidate.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function authApiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new AuthApiError(
      "Unable to reach CaloriZen. Check your connection and try again.",
      0,
    );
  }

  const body =
    response.status === 204
      ? null
      : ((await response.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null);

  if (!response.ok) {
    throw new AuthApiError(
      body?.error || "The request could not be completed. Please try again.",
      response.status,
    );
  }

  return body as T;
}
