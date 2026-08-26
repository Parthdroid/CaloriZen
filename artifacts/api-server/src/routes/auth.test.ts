import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import argon2 from "argon2";
import pg from "pg";
import { newDb } from "pg-mem";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://calorizen-test";
process.env.JWT_SECRET =
  "test-only-jwt-secret-that-is-at-least-thirty-two-bytes";
process.env.APPLE_CLIENT_IDS = "com.parth.calorizen";

const memory = newDb({ autoCreateForeignKeyIndices: true });
const pgAdapter = memory.adapters.createPg();
for (const Constructor of [pgAdapter.Pool, pgAdapter.Client]) {
  const originalQuery = Constructor.prototype.query;
  Constructor.prototype.query = async function patchedQuery(
    this: object,
    query: unknown,
    ...args: unknown[]
  ) {
    if (query && typeof query === "object") {
      const compatibleQuery = { ...(query as Record<string, unknown>) };
      const arrayMode = compatibleQuery.rowMode === "array";
      delete compatibleQuery.types;
      delete compatibleQuery.rowMode;
      const result = await Reflect.apply(originalQuery, this, [
        compatibleQuery,
        ...args,
      ]);
      if (
        arrayMode &&
        result &&
        typeof result === "object" &&
        "rows" in result
      ) {
        const typedResult = result as {
          fields?: Array<{ name: string }>;
          rows: Array<Record<string, unknown>>;
        };
        const names =
          typedResult.fields && typedResult.fields.length > 0
            ? typedResult.fields.map((field) => field.name)
            : Object.keys(typedResult.rows[0] ?? {});
        return {
          ...typedResult,
          rows: typedResult.rows.map((row) => names.map((name) => row[name])),
        };
      }
      return result;
    }
    return Reflect.apply(originalQuery, this, [query, ...args]) as unknown;
  } as typeof originalQuery;
}
Object.assign(pg, { Pool: pgAdapter.Pool, Client: pgAdapter.Client });

const emailMock = vi.hoisted(() => ({
  token: null as string | null,
  send: vi.fn(async (input: { token: string }) => {
    emailMock.token = input.token;
  }),
}));

const appleMock = vi.hoisted(() => ({
  verify: vi.fn(async (token: string) => {
    if (token !== "verified-legacy-token")
      throw new Error("Invalid Apple token");
    return {
      subject: "verified-apple-subject",
      audience: "com.parth.calorizen",
      email: "apple-owner@example.com",
      emailVerified: true,
      issuedAt: Math.floor(Date.now() / 1000),
    };
  }),
  revoke: vi.fn(async () => undefined),
}));

vi.mock("../lib/email", () => ({
  sendPasswordResetEmail: emailMock.send,
  assertEmailConfiguration: vi.fn(),
}));

vi.mock("../lib/apple", () => ({
  verifyAppleIdentityToken: appleMock.verify,
  revokeAppleAuthorizationCode: appleMock.revoke,
  assertAppleConfiguration: vi.fn(),
}));

let app: express.Express;
let pool: import("pg").Pool;
let cleanDatabase: ReturnType<typeof memory.backup>;

const schemaSql = `
  CREATE TABLE users (
    id serial PRIMARY KEY,
    email varchar(255) NOT NULL,
    email_normalized varchar(255) NOT NULL,
    name varchar(255),
    avatar_url text,
    provider varchar(20) NOT NULL,
    provider_id varchar(255) NOT NULL,
    session_version integer NOT NULL DEFAULT 0,
    email_verified_at timestamptz,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX users_email_normalized_idx ON users(email_normalized);
  CREATE TABLE account_email_addresses (
    email_normalized varchar(255) PRIMARY KEY,
    user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE password_credentials (
    user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash text NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE apple_identities (
    subject varchar(255) PRIMARY KEY,
    user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE password_reset_tokens (
    token_hash varchar(64) PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE meals (
    id serial PRIMARY KEY,
    user_id integer REFERENCES users(id) ON DELETE CASCADE,
    meal_type text NOT NULL DEFAULT 'snack',
    logged_at timestamp NOT NULL DEFAULT now(),
    image_url text,
    notes text,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    total_calories real NOT NULL DEFAULT 0,
    total_protein real NOT NULL DEFAULT 0,
    total_carbs real NOT NULL DEFAULT 0,
    total_fat real NOT NULL DEFAULT 0
  );
  CREATE TABLE goals (
    id serial PRIMARY KEY,
    user_id integer REFERENCES users(id) ON DELETE CASCADE,
    daily_calories integer NOT NULL DEFAULT 2000,
    daily_protein integer NOT NULL DEFAULT 150,
    daily_carbs integer NOT NULL DEFAULT 200,
    daily_fat integer NOT NULL DEFAULT 65,
    updated_at timestamp NOT NULL DEFAULT now()
  );
`;

beforeAll(async () => {
  const dbModule = await import("@workspace/db");
  pool = dbModule.pool;
  await pool.query(schemaSql);
  cleanDatabase = memory.backup();

  const [{ default: authRouter }, { default: mealsRouter }] = await Promise.all(
    [import("./auth"), import("./meals")],
  );
  app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    } as unknown as Request["log"];
    next();
  });
  app.use("/api", authRouter);
  app.use("/api", mealsRouter);
});

beforeEach(async () => {
  emailMock.token = null;
  emailMock.send.mockClear();
  appleMock.verify.mockClear();
  appleMock.revoke.mockClear();
  cleanDatabase.restore();
});

async function register(
  email = "person@example.com",
  password = "CorrectHorseBattery9",
) {
  return request(app).post("/api/auth/register").send({
    name: "Test Person",
    email,
    password,
    confirmPassword: password,
  });
}

describe("email authentication", () => {
  it("registers a normalized account and stores only an Argon2id hash", async () => {
    const response = await register("  Person@Example.COM  ");
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("person@example.com");
    expect(response.body.user.authMethods).toEqual({
      password: true,
      apple: false,
    });
    expect(response.body.token).toEqual(expect.any(String));

    const stored = await pool.query<{ password_hash: string }>(
      "SELECT password_hash FROM password_credentials",
    );
    expect(stored.rows[0].password_hash).toMatch(/^\$argon2id\$/);
    expect(stored.rows[0].password_hash).not.toContain("CorrectHorseBattery9");
    await expect(
      argon2.verify(stored.rows[0].password_hash, "CorrectHorseBattery9"),
    ).resolves.toBe(true);
  });

  it("rejects duplicate normalized email accounts", async () => {
    expect((await register("Person@Example.com")).status).toBe(201);
    const duplicate = await register("person@example.COM");
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toContain("already exists");
  });

  it("logs in with valid credentials and rejects invalid credentials", async () => {
    await register();
    const valid = await request(app).post("/api/auth/login").send({
      email: "PERSON@example.com",
      password: "CorrectHorseBattery9",
    });
    expect(valid.status).toBe(200);
    expect(valid.body.token).toEqual(expect.any(String));

    const invalid = await request(app).post("/api/auth/login").send({
      email: "person@example.com",
      password: "WrongPassword999",
    });
    expect(invalid.status).toBe(401);
    expect(invalid.body.error).toBe("Email or password is incorrect");
  });

  it("uses single-use hashed reset tokens and invalidates the old password", async () => {
    const registration = await register();
    const forgot = await request(app)
      .post("/api/auth/password/forgot")
      .send({ email: "person@example.com" });
    expect(forgot.status).toBe(202);
    expect(emailMock.token).toEqual(expect.any(String));

    const stored = await pool.query<{ token_hash: string }>(
      "SELECT token_hash FROM password_reset_tokens",
    );
    expect(stored.rows[0].token_hash).toHaveLength(64);
    expect(stored.rows[0].token_hash).not.toBe(emailMock.token);

    const reset = await request(app).post("/api/auth/password/reset").send({
      token: emailMock.token,
      password: "EvenBetterPassword42",
      confirmPassword: "EvenBetterPassword42",
    });
    expect(reset.status).toBe(200);

    const staleSession = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registration.body.token}`);
    expect(staleSession.status).toBe(401);

    const replay = await request(app).post("/api/auth/password/reset").send({
      token: emailMock.token,
      password: "AnotherPassword42",
      confirmPassword: "AnotherPassword42",
    });
    expect(replay.status).toBe(400);

    const oldLogin = await request(app).post("/api/auth/login").send({
      email: "person@example.com",
      password: "CorrectHorseBattery9",
    });
    const newLogin = await request(app).post("/api/auth/login").send({
      email: "person@example.com",
      password: "EvenBetterPassword42",
    });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  it("rejects an expired password reset token", async () => {
    await register();
    await request(app)
      .post("/api/auth/password/forgot")
      .send({ email: "person@example.com" });
    expect(emailMock.token).toEqual(expect.any(String));

    await pool.query("UPDATE password_reset_tokens SET expires_at = $1", [
      new Date(Date.now() - 60_000),
    ]);

    const reset = await request(app).post("/api/auth/password/reset").send({
      token: emailMock.token,
      password: "EvenBetterPassword42",
      confirmPassword: "EvenBetterPassword42",
    });
    expect(reset.status).toBe(400);
    expect(reset.body.error).toContain("invalid or has expired");
  });

  it("does not reveal whether an account exists during recovery", async () => {
    const response = await request(app)
      .post("/api/auth/password/forgot")
      .send({ email: "missing@example.com" });
    expect(response.status).toBe(202);
    expect(response.body.message).toContain("If an account exists");
    expect(emailMock.send).not.toHaveBeenCalled();
  });

  it("lets a unique legacy social account set a password without duplicating its data", async () => {
    const legacy = await pool.query<{ id: number }>(`
      INSERT INTO users (
        email, email_normalized, name, provider, provider_id
      ) VALUES (
        'legacy@example.com', 'legacy@example.com', 'Legacy User', 'google', 'legacy-subject'
      ) RETURNING id
    `);
    const userId = legacy.rows[0].id;
    await pool.query(
      "INSERT INTO account_email_addresses (email_normalized, user_id) VALUES ($1, $2)",
      ["legacy@example.com", userId],
    );
    await pool.query(
      "INSERT INTO meals (user_id, meal_type, items) VALUES ($1, 'lunch', '[]'::jsonb)",
      [userId],
    );

    expect(
      (
        await request(app)
          .post("/api/auth/password/forgot")
          .send({ email: "legacy@example.com" })
      ).status,
    ).toBe(202);
    expect(emailMock.token).toEqual(expect.any(String));

    const reset = await request(app).post("/api/auth/password/reset").send({
      token: emailMock.token,
      password: "RecoveredAccountPass42",
      confirmPassword: "RecoveredAccountPass42",
    });
    expect(reset.status).toBe(200);

    const login = await request(app).post("/api/auth/login").send({
      email: "legacy@example.com",
      password: "RecoveredAccountPass42",
    });
    expect(login.status).toBe(200);
    expect(login.body.user.id).toBe(userId);
    expect((await pool.query("SELECT id FROM users")).rowCount).toBe(1);
    expect(
      (await pool.query("SELECT id FROM meals WHERE user_id = $1", [userId]))
        .rowCount,
    ).toBe(1);
  });

  it("requires password reauthentication and cascades account deletion", async () => {
    const registration = await register();
    const authorization = `Bearer ${registration.body.token}`;
    await request(app)
      .post("/api/meals")
      .set("Authorization", authorization)
      .send({
        mealType: "dinner",
        items: [
          {
            name: "Deletion test meal",
            servingDescription: "1 serving",
            calories: 300,
            protein: 15,
            carbs: 35,
            fat: 10,
          },
        ],
      });

    const rejected = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", authorization)
      .send({ password: "WrongPassword999" });
    expect(rejected.status).toBe(401);
    expect((await pool.query("SELECT id FROM users")).rowCount).toBe(1);

    const deleted = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", authorization)
      .send({ password: "CorrectHorseBattery9" });
    expect(deleted.status).toBe(204);
    expect((await pool.query("SELECT id FROM users")).rowCount).toBe(0);
    expect((await pool.query("SELECT id FROM meals")).rowCount).toBe(0);
    expect(
      (await request(app).get("/api/meals").set("Authorization", authorization))
        .status,
    ).toBe(401);
  });

  it("invalidates the current session on logout", async () => {
    const registration = await register();
    const authorization = `Bearer ${registration.body.token}`;

    const loggedOut = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", authorization);
    expect(loggedOut.status).toBe(204);

    const staleSession = await request(app)
      .get("/api/auth/me")
      .set("Authorization", authorization);
    expect(staleSession.status).toBe(401);
  });
});

describe("Apple authentication", () => {
  it("rejects an invalid identity token and ignores client-supplied identity fields", async () => {
    const response = await request(app).post("/api/auth/apple").send({
      identityToken: "not-a-valid-jwt",
      email: "attacker@example.com",
      appleUserId: "forged-user-id",
      fullName: "Attacker",
    });
    expect(response.status).toBe(401);
    expect((await pool.query("SELECT id FROM users")).rowCount).toBe(0);
  });

  it("recovers a legacy Apple row only after a verified subject match", async () => {
    const legacy = await pool.query<{ id: number }>(`
      INSERT INTO users (
        email, email_normalized, name, provider, provider_id
      ) VALUES (
        'unverified-subject@privaterelay.appleid.com',
        'unverified-subject@privaterelay.appleid.com',
        NULL,
        'apple',
        'verified-apple-subject'
      ) RETURNING id
    `);
    const userId = legacy.rows[0].id;
    await pool.query(
      "INSERT INTO account_email_addresses (email_normalized, user_id) VALUES ($1, $2)",
      ["unverified-subject@privaterelay.appleid.com", userId],
    );

    const response = await request(app).post("/api/auth/apple").send({
      identityToken: "verified-legacy-token",
      fullName: "Verified Owner",
      email: "forged@example.com",
      appleUserId: "forged-subject",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(userId);
    expect(response.body.user.email).toBe("apple-owner@example.com");
    expect(response.body.user.authMethods).toEqual({
      password: false,
      apple: true,
    });
    expect((await pool.query("SELECT id FROM users")).rowCount).toBe(1);
    expect(
      (
        await pool.query(
          "SELECT subject FROM apple_identities WHERE user_id = $1",
          [userId],
        )
      ).rows[0].subject,
    ).toBe("verified-apple-subject");
  });

  it("requires mailbox verification before linking Apple to a password account", async () => {
    const registration = await register();
    const verifiedPasswordIdentity = {
      subject: "verified-apple-subject",
      audience: "com.parth.calorizen",
      email: "person@example.com",
      emailVerified: true,
      issuedAt: Math.floor(Date.now() / 1000),
    };
    appleMock.verify
      .mockResolvedValueOnce(verifiedPasswordIdentity)
      .mockResolvedValueOnce(verifiedPasswordIdentity);

    const blocked = await request(app).post("/api/auth/apple").send({
      identityToken: "verified-password-account-token",
    });
    expect(blocked.status).toBe(409);
    expect(
      (await pool.query("SELECT subject FROM apple_identities")).rowCount,
    ).toBe(0);

    await request(app)
      .post("/api/auth/password/forgot")
      .send({ email: "person@example.com" });
    const reset = await request(app).post("/api/auth/password/reset").send({
      token: emailMock.token,
      password: "VerifiedMailboxPassword42",
      confirmPassword: "VerifiedMailboxPassword42",
    });
    expect(reset.status).toBe(200);

    const linked = await request(app).post("/api/auth/apple").send({
      identityToken: "verified-password-account-token",
    });
    expect(linked.status).toBe(200);
    expect(linked.body.user.id).toBe(registration.body.user.id);
    expect(linked.body.user.authMethods).toEqual({
      password: true,
      apple: true,
    });
  });

  it("does not link Apple to an email-only legacy row without a canonical alias", async () => {
    await pool.query(`
      INSERT INTO users (
        email, email_normalized, name, provider, provider_id
      ) VALUES (
        'apple-owner@example.com',
        'apple-owner@example.com',
        'Legacy Email Row',
        'google',
        'legacy-email-only-subject'
      )
    `);

    const response = await request(app).post("/api/auth/apple").send({
      identityToken: "verified-legacy-token",
    });

    expect(response.status).toBe(409);
    expect(
      (await pool.query("SELECT subject FROM apple_identities")).rowCount,
    ).toBe(0);
    expect((await pool.query("SELECT id FROM users")).rowCount).toBe(1);
  });
});

describe("protected meal endpoints", () => {
  it("requires a valid session and enforces meal ownership", async () => {
    expect((await request(app).get("/api/meals")).status).toBe(401);

    const first = await register("first@example.com");
    const second = await register("second@example.com");
    const created = await request(app)
      .post("/api/meals")
      .set("Authorization", `Bearer ${first.body.token}`)
      .send({
        mealType: "lunch",
        items: [
          {
            name: "Test meal",
            servingDescription: "1 serving",
            calories: 400,
            protein: 20,
            carbs: 45,
            fat: 12,
          },
        ],
      });
    expect(created.status).toBe(201);

    const otherToken = `Bearer ${second.body.token}`;
    expect(
      (
        await request(app)
          .get(`/api/meals/${created.body.id}`)
          .set("Authorization", otherToken)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .delete(`/api/meals/${created.body.id}`)
          .set("Authorization", otherToken)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get(`/api/meals/${created.body.id}`)
          .set("Authorization", `Bearer ${first.body.token}`)
      ).status,
    ).toBe(200);
  });
});
