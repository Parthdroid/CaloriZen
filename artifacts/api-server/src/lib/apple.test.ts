import { SignJWT, exportJWK, generateKeyPair, type CryptoKey } from "jose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { verifyAppleIdentityToken } from "./apple";

const issuer = "https://appleid.apple.com";
const audience = "com.parth.calorizen";
const subject = "000123.calorizen-test-subject";
let privateKey: CryptoKey;

beforeAll(async () => {
  process.env.APPLE_CLIENT_IDS = audience;
  const keyPair = await generateKeyPair("RS256");
  privateKey = keyPair.privateKey;
  const publicJwk = await exportJWK(keyPair.publicKey);

  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            keys: [{ ...publicJwk, alg: "RS256", kid: "calorizen-test-key" }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
    ),
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

async function appleToken(
  options: {
    tokenIssuer?: string;
    tokenAudience?: string;
    expiresAt?: number | null;
    issuedAt?: number | null;
    tokenSubject?: string | null;
  } = {},
) {
  const now = Math.floor(Date.now() / 1000);
  let token = new SignJWT({
    email: "owner@example.com",
    email_verified: "true",
  })
    .setProtectedHeader({ alg: "RS256", kid: "calorizen-test-key" })
    .setIssuer(options.tokenIssuer ?? issuer)
    .setAudience(options.tokenAudience ?? audience);

  const tokenSubject =
    options.tokenSubject === undefined ? subject : options.tokenSubject;
  const issuedAt = options.issuedAt === undefined ? now : options.issuedAt;
  const expiresAt =
    options.expiresAt === undefined ? now + 5 * 60 : options.expiresAt;

  if (tokenSubject !== null) token = token.setSubject(tokenSubject);
  if (issuedAt !== null) token = token.setIssuedAt(issuedAt);
  if (expiresAt !== null) token = token.setExpirationTime(expiresAt);
  return token.sign(privateKey);
}

describe("Apple identity token verification", () => {
  it("accepts a correctly signed Apple identity token", async () => {
    const identity = await verifyAppleIdentityToken(await appleToken());
    expect(identity).toMatchObject({
      subject,
      audience,
      email: "owner@example.com",
      emailVerified: true,
    });
  });

  it.each([
    ["issuer", { tokenIssuer: "https://attacker.invalid" }],
    ["audience", { tokenAudience: "com.attacker.invalid" }],
    ["expiry", { expiresAt: Math.floor(Date.now() / 1000) - 60 }],
    ["missing expiry", { expiresAt: null }],
    ["subject", { tokenSubject: null }],
    ["issued-at", { issuedAt: null }],
  ])("rejects a token with an invalid %s claim", async (_claim, options) => {
    await expect(
      verifyAppleIdentityToken(await appleToken(options)),
    ).rejects.toThrow();
  });
});
