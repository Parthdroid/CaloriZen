import { randomBytes } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { assertAppleConfiguration } from "./apple";
import { assertEmailConfiguration } from "./email";

const TOKEN_ISSUER = "calorizen-api";
const TOKEN_AUDIENCE = "calorizen-app";
const TOKEN_EXPIRY = "7d";
const developmentSecret = randomBytes(48).toString("base64url");
let warnedAboutEphemeralSecret = false;

export interface AuthPayload {
  userId: number;
  email: string;
  sessionVersion: number;
}

type TokenClaims = JwtPayload & {
  email?: unknown;
  sessionVersion?: unknown;
};

function getJwtSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (configured) {
    if (Buffer.byteLength(configured, "utf8") < 32) {
      throw new Error("JWT_SECRET must be at least 32 bytes");
    }
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  if (!warnedAboutEphemeralSecret && process.env.NODE_ENV !== "test") {
    warnedAboutEphemeralSecret = true;
    console.warn("JWT_SECRET is unset; using an ephemeral development secret");
  }
  return developmentSecret;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(
    { email: payload.email, sessionVersion: payload.sessionVersion },
    getJwtSecret(),
    {
      algorithm: "HS256",
      audience: TOKEN_AUDIENCE,
      expiresIn: TOKEN_EXPIRY,
      issuer: TOKEN_ISSUER,
      subject: String(payload.userId),
    },
  );
}

export function verifyToken(token: string): AuthPayload {
  const claims = jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    audience: TOKEN_AUDIENCE,
    issuer: TOKEN_ISSUER,
  }) as TokenClaims;

  const userId = Number(claims.sub);
  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    typeof claims.email !== "string" ||
    !Number.isInteger(claims.sessionVersion)
  ) {
    throw new Error("Invalid session token claims");
  }

  return {
    userId,
    email: claims.email,
    sessionVersion: claims.sessionVersion as number,
  };
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    const [user] = await db
      .select({
        sessionVersion: usersTable.sessionVersion,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user || user.sessionVersion !== payload.sessionVersion) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    req.user = { ...payload, email: user.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function assertAuthConfiguration(): void {
  getJwtSecret();
  if (process.env.NODE_ENV === "production") {
    assertAppleConfiguration();
    assertEmailConfiguration();
  }
}
