import {
  SignJWT,
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify,
  type JWTPayload,
} from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

type ApplePayload = JWTPayload & {
  email?: string;
  email_verified?: boolean | string;
};

export type VerifiedAppleIdentity = {
  subject: string;
  audience: string;
  email: string | null;
  emailVerified: boolean;
  issuedAt: number;
};

function getAppleClientIds(): string[] {
  const configured = process.env.APPLE_CLIENT_IDS;
  if (!configured) {
    if (process.env.NODE_ENV === "test") return ["com.parth.calorizen"];
    throw new Error(
      "APPLE_CLIENT_IDS must contain the Sign in with Apple client ID",
    );
  }

  const values = configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length === 0) {
    throw new Error("APPLE_CLIENT_IDS must contain at least one client ID");
  }

  return values;
}

function claimIsTrue(value: boolean | string | undefined): boolean {
  return value === true || value === "true";
}

export async function verifyAppleIdentityToken(
  identityToken: string,
): Promise<VerifiedAppleIdentity> {
  const { payload } = await jwtVerify<ApplePayload>(identityToken, APPLE_JWKS, {
    algorithms: ["RS256"],
    issuer: APPLE_ISSUER,
    audience: getAppleClientIds(),
  });

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Apple identity token is missing a subject");
  }

  const audience = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
  if (!audience) {
    throw new Error("Apple identity token is missing an audience");
  }

  if (typeof payload.exp !== "number") {
    throw new Error("Apple identity token is missing an expiry");
  }
  if (typeof payload.iat !== "number") {
    throw new Error("Apple identity token is missing an issued-at time");
  }

  const email = typeof payload.email === "string" ? payload.email : null;

  return {
    subject: payload.sub,
    audience,
    email,
    emailVerified: email !== null && claimIsTrue(payload.email_verified),
    issuedAt: payload.iat,
  };
}

function requiredAppleRevocationConfig() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!teamId || !keyId || !privateKey) {
    throw new Error(
      "APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY are required for Apple account deletion",
    );
  }

  return { teamId, keyId, privateKey };
}

async function createAppleClientSecret(clientId: string): Promise<string> {
  const { teamId, keyId, privateKey } = requiredAppleRevocationConfig();
  const signingKey = await importPKCS8(privateKey, "ES256");
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience(APPLE_ISSUER)
    .setIssuedAt(now)
    .setExpirationTime(now + 5 * 60)
    .sign(signingKey);
}

async function postAppleForm(path: string, body: URLSearchParams) {
  const response = await fetch(`${APPLE_ISSUER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    throw new Error(
      `Apple token service rejected the request (${response.status})`,
    );
  }
  return data;
}

export async function revokeAppleAuthorizationCode(
  authorizationCode: string,
  clientId: string,
): Promise<void> {
  const clientSecret = await createAppleClientSecret(clientId);
  const tokenData = await postAppleForm(
    "/auth/token",
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
    }),
  );

  const token =
    typeof tokenData.refresh_token === "string"
      ? tokenData.refresh_token
      : typeof tokenData.access_token === "string"
        ? tokenData.access_token
        : null;

  if (!token) {
    throw new Error("Apple token response did not include a revocable token");
  }

  await postAppleForm(
    "/auth/revoke",
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token,
      token_type_hint:
        typeof tokenData.refresh_token === "string"
          ? "refresh_token"
          : "access_token",
    }),
  );
}

export function assertAppleConfiguration(): void {
  getAppleClientIds();
  requiredAppleRevocationConfig();
}
