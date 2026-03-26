import { Router, type IRouter, type Request, type Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { signToken, requireAuth, type AuthRequest } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

const googleClient = new OAuth2Client();

const googleAuthSchema = z.object({
  idToken: z.string(),
});

const appleAuthSchema = z.object({
  identityToken: z.string(),
  email: z.string().email().optional().nullable(),
  fullName: z.string().optional().nullable(),
  appleUserId: z.string(),
});

async function findOrCreateUser(
  provider: string,
  providerId: string,
  email: string,
  name?: string | null,
  avatarUrl?: string | null,
) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.provider, provider), eq(usersTable.providerId, providerId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      name: name ?? null,
      avatarUrl: avatarUrl ?? null,
      provider,
      providerId,
    })
    .returning();

  return user;
}

router.post("/auth/google", async (req: Request, res: Response) => {
  const parsed = googleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token" });
      return;
    }

    const user = await findOrCreateUser(
      "google",
      payload.sub,
      payload.email,
      payload.name,
      payload.picture,
    );

    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

router.post("/auth/apple", async (req: Request, res: Response) => {
  const parsed = appleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const { appleUserId, email, fullName } = parsed.data;

    const userEmail = email || `${appleUserId}@privaterelay.appleid.com`;

    const user = await findOrCreateUser(
      "apple",
      appleUserId,
      userEmail,
      fullName,
      null,
    );

    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error("Apple auth error:", err);
    res.status(401).json({ error: "Apple authentication failed" });
  }
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
  });
});

export default router;
