import jwt from "jsonwebtoken";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const testSecret = "test-only-jwt-secret-that-is-at-least-thirty-two-bytes";
const payload = {
  userId: 42,
  email: "person@example.com",
  sessionVersion: 3,
};
const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;
const originalDatabaseUrl = process.env.DATABASE_URL;
let signToken: typeof import("./auth").signToken;
let verifyToken: typeof import("./auth").verifyToken;

beforeAll(async () => {
  process.env.DATABASE_URL = "postgresql://calorizen-jwt-test";
  ({ signToken, verifyToken } = await import("./auth"));
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

afterAll(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

describe("JWT sessions", () => {
  it("signs a seven-day token with the required claims", () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = testSecret;

    const token = signToken(payload);
    expect(verifyToken(token)).toEqual(payload);

    const claims = jwt.decode(token);
    expect(claims).toMatchObject({
      sub: "42",
      iss: "calorizen-api",
      aud: "calorizen-app",
      email: "person@example.com",
      sessionVersion: 3,
    });
    expect(typeof claims).toBe("object");
    if (!claims || typeof claims === "string")
      throw new Error("Invalid claims");
    expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBe(7 * 24 * 60 * 60);
  });

  it.each([
    ["issuer", { issuer: "attacker-api", audience: "calorizen-app" }],
    ["audience", { issuer: "calorizen-api", audience: "attacker-app" }],
  ])("rejects a token with the wrong %s", (_claim, options) => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = testSecret;
    const token = jwt.sign(
      { email: payload.email, sessionVersion: payload.sessionVersion },
      testSecret,
      {
        algorithm: "HS256",
        expiresIn: "7d",
        issuer: options.issuer,
        audience: options.audience,
        subject: String(payload.userId),
      },
    );

    expect(() => verifyToken(token)).toThrow();
  });

  it("rejects an expired token", () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = testSecret;
    const token = jwt.sign(
      { email: payload.email, sessionVersion: payload.sessionVersion },
      testSecret,
      {
        algorithm: "HS256",
        expiresIn: -1,
        issuer: "calorizen-api",
        audience: "calorizen-app",
        subject: String(payload.userId),
      },
    );

    expect(() => verifyToken(token)).toThrow();
  });

  it("requires a sufficiently long JWT secret in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    expect(() => signToken(payload)).toThrow(
      "JWT_SECRET is required in production",
    );

    process.env.JWT_SECRET = "too-short";
    expect(() => signToken(payload)).toThrow("at least 32 bytes");
  });
});
