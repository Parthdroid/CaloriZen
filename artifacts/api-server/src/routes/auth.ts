import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import {
  accountEmailAddressesTable,
  appleIdentitiesTable,
  db,
  passwordCredentialsTable,
  passwordResetTokensTable,
  usersTable,
  type User,
} from "@workspace/db";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { signToken, requireAuth, type AuthRequest } from "../lib/auth";
import {
  revokeAppleAuthorizationCode,
  verifyAppleIdentityToken,
} from "../lib/apple";
import { sendPasswordResetEmail } from "../lib/email";
import {
  hashPassword,
  passwordHashNeedsUpgrade,
  verifyPassword,
} from "../lib/password";

const router: IRouter = Router();
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const APPLE_DELETE_REAUTH_MAX_AGE_SECONDS = 5 * 60;
const PASSWORD_MIN_LENGTH = 12;

class DuplicateAccountError extends Error {}
class AmbiguousLegacyAccountError extends Error {}

const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(32).max(256),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const appleAuthSchema = z.object({
  identityToken: z.string().min(1).max(16_384),
  fullName: z.string().trim().min(1).max(80).optional().nullable(),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128).optional(),
  appleIdentityToken: z.string().min(1).max(16_384).optional(),
  appleAuthorizationCode: z.string().min(1).max(4096).optional(),
});

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().normalize("NFKC");
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function isUniqueViolation(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object") return false;
    if ("code" in current && current.code === "23505") return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Too many attempts. Please wait and try again." },
});

const recoveryLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Too many reset requests. Please wait and try again." },
});

async function getAuthMethods(userId: number) {
  const [password, apple] = await Promise.all([
    db
      .select({ userId: passwordCredentialsTable.userId })
      .from(passwordCredentialsTable)
      .where(eq(passwordCredentialsTable.userId, userId))
      .limit(1),
    db
      .select({ userId: appleIdentitiesTable.userId })
      .from(appleIdentitiesTable)
      .where(eq(appleIdentitiesTable.userId, userId))
      .limit(1),
  ]);

  return { password: password.length > 0, apple: apple.length > 0 };
}

async function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    authMethods: await getAuthMethods(user.id),
  };
}

async function sessionResponse(user: User) {
  return {
    token: signToken({
      userId: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion,
    }),
    user: await publicUser(user),
  };
}

let dummyHashPromise: Promise<string> | null = null;
function getDummyPasswordHash() {
  dummyHashPromise ??= hashPassword("not-a-real-calorizen-password");
  return dummyHashPromise;
}

router.post(
  "/auth/register",
  sensitiveLimiter,
  async (req: Request, res: Response) => {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error:
          parsed.error.issues[0]?.message ??
          "Please check your account details",
      });
      return;
    }

    const emailNormalized = normalizeEmail(parsed.data.email);
    const name = normalizeName(parsed.data.name);
    const passwordHash = await hashPassword(parsed.data.password);

    try {
      const user = await db.transaction(async (tx) => {
        const existing = await tx
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.emailNormalized, emailNormalized))
          .limit(1);
        if (existing.length > 0) throw new DuplicateAccountError();

        const [created] = await tx
          .insert(usersTable)
          .values({
            email: emailNormalized,
            emailNormalized,
            name,
            provider: "email",
            providerId: randomUUID(),
          })
          .returning();

        await tx.insert(accountEmailAddressesTable).values({
          emailNormalized,
          userId: created.id,
        });
        await tx.insert(passwordCredentialsTable).values({
          userId: created.id,
          passwordHash,
        });
        return created;
      });

      res.status(201).json(await sessionResponse(user));
    } catch (error) {
      if (error instanceof DuplicateAccountError || isUniqueViolation(error)) {
        res.status(409).json({
          error:
            "An account already exists for this email. Use Forgot password to set or reset its password.",
        });
        return;
      }
      req.log.error({ err: error }, "Registration failed");
      res
        .status(500)
        .json({ error: "Account creation failed. Please try again." });
    }
  },
);

router.post(
  "/auth/login",
  sensitiveLimiter,
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid email and password" });
      return;
    }

    const emailNormalized = normalizeEmail(parsed.data.email);
    const [account] = await db
      .select({
        user: usersTable,
        passwordHash: passwordCredentialsTable.passwordHash,
      })
      .from(accountEmailAddressesTable)
      .innerJoin(
        usersTable,
        eq(accountEmailAddressesTable.userId, usersTable.id),
      )
      .innerJoin(
        passwordCredentialsTable,
        eq(passwordCredentialsTable.userId, usersTable.id),
      )
      .where(eq(accountEmailAddressesTable.emailNormalized, emailNormalized))
      .limit(1);

    const passwordHash =
      account?.passwordHash ?? (await getDummyPasswordHash());
    const passwordMatches = await verifyPassword(
      passwordHash,
      parsed.data.password,
    );
    if (!account || !passwordMatches) {
      res.status(401).json({ error: "Email or password is incorrect" });
      return;
    }

    if (passwordHashNeedsUpgrade(account.passwordHash)) {
      const upgraded = await hashPassword(parsed.data.password);
      await db
        .update(passwordCredentialsTable)
        .set({ passwordHash: upgraded, changedAt: new Date() })
        .where(eq(passwordCredentialsTable.userId, account.user.id));
    }

    res.json(await sessionResponse(account.user));
  },
);

router.post(
  "/auth/password/forgot",
  recoveryLimiter,
  async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid email address" });
      return;
    }

    const emailNormalized = normalizeEmail(parsed.data.email);
    const [account] = await db
      .select({ user: usersTable })
      .from(accountEmailAddressesTable)
      .innerJoin(
        usersTable,
        eq(accountEmailAddressesTable.userId, usersTable.id),
      )
      .where(eq(accountEmailAddressesTable.emailNormalized, emailNormalized))
      .limit(1);

    if (account) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = hashResetToken(token);
      await db.transaction(async (tx) => {
        await tx
          .update(passwordResetTokensTable)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(passwordResetTokensTable.userId, account.user.id),
              isNull(passwordResetTokensTable.usedAt),
            ),
          );
        await tx.insert(passwordResetTokensTable).values({
          tokenHash,
          userId: account.user.id,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        });
      });

      try {
        await sendPasswordResetEmail({
          to: account.user.email,
          name: account.user.name,
          token,
        });
      } catch (error) {
        await db
          .delete(passwordResetTokensTable)
          .where(eq(passwordResetTokensTable.tokenHash, tokenHash));
        req.log.error({ err: error }, "Password reset email delivery failed");
      }
    }

    res.status(202).json({
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  },
);

router.post(
  "/auth/password/reset",
  sensitiveLimiter,
  async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error:
          parsed.error.issues[0]?.message ?? "Invalid password reset request",
      });
      return;
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const tokenHash = hashResetToken(parsed.data.token);

    const resetUser = await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(passwordResetTokensTable)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokensTable.tokenHash, tokenHash),
            isNull(passwordResetTokensTable.usedAt),
            gt(passwordResetTokensTable.expiresAt, new Date()),
          ),
        )
        .returning({ userId: passwordResetTokensTable.userId });

      if (!claimed) return null;

      await tx
        .insert(passwordCredentialsTable)
        .values({ userId: claimed.userId, passwordHash })
        .onConflictDoUpdate({
          target: passwordCredentialsTable.userId,
          set: { passwordHash, changedAt: new Date() },
        });
      await tx
        .update(accountEmailAddressesTable)
        .set({ verifiedAt: new Date() })
        .where(eq(accountEmailAddressesTable.userId, claimed.userId));
      const [user] = await tx
        .update(usersTable)
        .set({
          emailVerifiedAt: new Date(),
          sessionVersion: sql`${usersTable.sessionVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, claimed.userId))
        .returning();
      return user ?? null;
    });

    if (!resetUser) {
      res
        .status(400)
        .json({ error: "This reset link is invalid or has expired" });
      return;
    }

    res.json({ message: "Password updated. You can now sign in." });
  },
);

router.post(
  "/auth/apple",
  sensitiveLimiter,
  async (req: Request, res: Response) => {
    const parsed = appleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid Apple sign-in request" });
      return;
    }

    try {
      const identity = await verifyAppleIdentityToken(
        parsed.data.identityToken,
      );
      const [existingIdentity] = await db
        .select({ user: usersTable })
        .from(appleIdentitiesTable)
        .innerJoin(usersTable, eq(appleIdentitiesTable.userId, usersTable.id))
        .where(eq(appleIdentitiesTable.subject, identity.subject))
        .limit(1);

      if (existingIdentity) {
        let user = existingIdentity.user;
        const updates: Partial<typeof usersTable.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (!user.name && parsed.data.fullName)
          updates.name = normalizeName(parsed.data.fullName);
        if (
          identity.emailVerified &&
          identity.email &&
          normalizeEmail(identity.email) === user.emailNormalized
        ) {
          updates.emailVerifiedAt = user.emailVerifiedAt ?? new Date();
        }
        [user] = await db
          .update(usersTable)
          .set(updates)
          .where(eq(usersTable.id, user.id))
          .returning();
        res.json(await sessionResponse(user));
        return;
      }

      // Legacy Apple rows were created by an endpoint that trusted the client's
      // provider ID. Recover one only after the verified token proves ownership
      // of that exact Apple subject; never pre-trust those database values.
      const legacyAppleMatches = await db
        .select({ user: usersTable })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.provider, "apple"),
            eq(usersTable.providerId, identity.subject),
          ),
        )
        .limit(2);
      if (legacyAppleMatches.length > 1)
        throw new AmbiguousLegacyAccountError();

      if (legacyAppleMatches.length === 1) {
        const recovered = await db.transaction(async (tx) => {
          const legacyUser = legacyAppleMatches[0].user;
          const updates: Partial<typeof usersTable.$inferInsert> = {
            updatedAt: new Date(),
          };

          if (identity.email && identity.emailVerified) {
            const emailNormalized = normalizeEmail(identity.email);
            const [emailOwner] = await tx
              .select({
                userId: accountEmailAddressesTable.userId,
              })
              .from(accountEmailAddressesTable)
              .where(
                eq(accountEmailAddressesTable.emailNormalized, emailNormalized),
              )
              .limit(1);
            if (emailOwner && emailOwner.userId !== legacyUser.id) {
              throw new AmbiguousLegacyAccountError();
            }

            const [existingAlias] = await tx
              .select({
                emailNormalized: accountEmailAddressesTable.emailNormalized,
              })
              .from(accountEmailAddressesTable)
              .where(eq(accountEmailAddressesTable.userId, legacyUser.id))
              .limit(1);
            if (existingAlias) {
              await tx
                .update(accountEmailAddressesTable)
                .set({ emailNormalized, verifiedAt: new Date() })
                .where(eq(accountEmailAddressesTable.userId, legacyUser.id));
            } else {
              await tx.insert(accountEmailAddressesTable).values({
                emailNormalized,
                userId: legacyUser.id,
                verifiedAt: new Date(),
              });
            }

            updates.email = emailNormalized;
            updates.emailNormalized = emailNormalized;
            updates.emailVerifiedAt = new Date();
          }
          if (!legacyUser.name && parsed.data.fullName) {
            updates.name = normalizeName(parsed.data.fullName);
          }

          await tx.insert(appleIdentitiesTable).values({
            subject: identity.subject,
            userId: legacyUser.id,
          });
          const [user] = await tx
            .update(usersTable)
            .set(updates)
            .where(eq(usersTable.id, legacyUser.id))
            .returning();
          return user;
        });

        res.json(await sessionResponse(recovered));
        return;
      }

      if (!identity.email || !identity.emailVerified) {
        res.status(409).json({
          error:
            "Apple did not provide a verified email for this new account. Revoke CaloriZen access in Apple settings and try again.",
        });
        return;
      }

      const emailNormalized = normalizeEmail(identity.email);
      const fullName = parsed.data.fullName
        ? normalizeName(parsed.data.fullName)
        : null;
      const user = await db.transaction(async (tx) => {
        const [canonicalEmail] = await tx
          .select({ userId: accountEmailAddressesTable.userId })
          .from(accountEmailAddressesTable)
          .where(
            eq(accountEmailAddressesTable.emailNormalized, emailNormalized),
          )
          .limit(1);

        let userId = canonicalEmail?.userId;
        if (!userId) {
          const legacyMatches = await tx
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.emailNormalized, emailNormalized))
            .limit(2);
          if (legacyMatches.length > 1) throw new AmbiguousLegacyAccountError();

          if (legacyMatches.length === 1) {
            userId = legacyMatches[0].id;
            await tx.insert(accountEmailAddressesTable).values({
              emailNormalized,
              userId,
              verifiedAt: new Date(),
            });
          } else {
            const [created] = await tx
              .insert(usersTable)
              .values({
                email: emailNormalized,
                emailNormalized,
                emailVerifiedAt: new Date(),
                name: fullName,
                provider: "apple",
                providerId: identity.subject,
              })
              .returning();
            userId = created.id;
            await tx.insert(accountEmailAddressesTable).values({
              emailNormalized,
              userId,
              verifiedAt: new Date(),
            });
          }
        } else {
          await tx
            .update(accountEmailAddressesTable)
            .set({ verifiedAt: new Date() })
            .where(
              eq(accountEmailAddressesTable.emailNormalized, emailNormalized),
            );
        }

        await tx.insert(appleIdentitiesTable).values({
          subject: identity.subject,
          userId,
        });

        const [linked] = await tx
          .update(usersTable)
          .set({
            emailVerifiedAt: new Date(),
            ...(fullName
              ? { name: sql`coalesce(${usersTable.name}, ${fullName})` }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(usersTable.id, userId))
          .returning();
        return linked;
      });

      res.json(await sessionResponse(user));
    } catch (error) {
      if (
        error instanceof AmbiguousLegacyAccountError ||
        isUniqueViolation(error)
      ) {
        res.status(409).json({
          error:
            "This email needs account recovery before Apple sign-in can be linked. Contact support for help.",
        });
        return;
      }
      req.log.warn({ err: error }, "Apple identity token rejected");
      res.status(401).json({ error: "Apple authentication failed" });
    }
  },
);

router.get("/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(await publicUser(user));
});

router.delete(
  "/auth/account",
  requireAuth,
  sensitiveLimiter,
  async (req: AuthRequest, res: Response) => {
    const parsed = deleteAccountSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid account deletion request" });
      return;
    }

    const userId = req.user!.userId;
    const [credential, appleIdentity] = await Promise.all([
      db
        .select({ passwordHash: passwordCredentialsTable.passwordHash })
        .from(passwordCredentialsTable)
        .where(eq(passwordCredentialsTable.userId, userId))
        .limit(1),
      db
        .select({ subject: appleIdentitiesTable.subject })
        .from(appleIdentitiesTable)
        .where(eq(appleIdentitiesTable.userId, userId))
        .limit(1),
    ]);

    if (credential[0]) {
      if (!parsed.data.password) {
        res
          .status(400)
          .json({ error: "Enter your password to delete this account" });
        return;
      }
      if (
        !(await verifyPassword(
          credential[0].passwordHash,
          parsed.data.password,
        ))
      ) {
        res.status(401).json({ error: "Password is incorrect" });
        return;
      }
    }

    if (appleIdentity[0]) {
      if (
        !parsed.data.appleIdentityToken ||
        !parsed.data.appleAuthorizationCode
      ) {
        res
          .status(400)
          .json({ error: "Confirm with Apple to delete this account" });
        return;
      }

      try {
        const identity = await verifyAppleIdentityToken(
          parsed.data.appleIdentityToken,
        );
        const age = identity.issuedAt
          ? Math.floor(Date.now() / 1000) - identity.issuedAt
          : Infinity;
        if (
          identity.subject !== appleIdentity[0].subject ||
          age < 0 ||
          age > APPLE_DELETE_REAUTH_MAX_AGE_SECONDS
        ) {
          res
            .status(401)
            .json({ error: "Apple confirmation is invalid or expired" });
          return;
        }
        await revokeAppleAuthorizationCode(
          parsed.data.appleAuthorizationCode,
          identity.audience,
        );
      } catch (error) {
        req.log.error({ err: error }, "Apple account revocation failed");
        res.status(503).json({
          error: "Apple confirmation could not be completed. Please try again.",
        });
        return;
      }
    }

    if (!credential[0] && !appleIdentity[0]) {
      res
        .status(409)
        .json({ error: "This account needs support-assisted recovery" });
      return;
    }

    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.status(204).send();
  },
);

export default router;
