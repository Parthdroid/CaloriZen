# CaloriZen authentication and release setup

This document is the deployment runbook for the email/password and Sign in with Apple authentication system. Do not deploy the API before applying the database migration, and do not put any secret in Expo public variables, `app.json`, source control, build logs, or App Store metadata.

## Deployment order

1. Take a verified PostgreSQL backup and test its restore procedure.
2. Apply `lib/db/migrations/0001_secure_email_auth.sql` in staging with:

   ```sh
   DATABASE_URL='postgresql://…' pnpm --filter @workspace/db migrate
   ```

3. Run the legacy-account audit queries below and resolve any ambiguous rows before announcing password recovery.
4. Configure the API secrets and deploy the API. Its startup check intentionally fails in production if authentication or recovery configuration is incomplete.
5. Configure `EXPO_PUBLIC_API_URL` in Xcode Cloud/EAS and build the iOS app.
6. Test registration, password reset, Apple sign-in (including Hide My Email), sign-out/sign-in, and in-app account deletion against production-like infrastructure.

The migration adds authentication tables and columns without deleting users, meals, or goals. Foreign keys on existing meal and goal tables are added `NOT VALID`, which enforces ownership and deletion behavior without rejecting deployment because of historical orphaned rows. Validate and clean historical orphans separately after making a backup.

## API environment

All values below are server-only unless explicitly marked otherwise.

| Variable                                   | Required            | Purpose                                                                                                                                                                 |
| ------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                             | Yes                 | PostgreSQL connection string. Require TLS according to the database provider's instructions.                                                                            |
| `JWT_SECRET`                               | Production          | Random secret of at least 32 bytes. Generate and store it in the hosting secret manager. Rotating it signs out every user.                                              |
| `APPLE_CLIENT_IDS`                         | Production          | Comma-separated accepted Apple audiences. For the native app this includes `com.parth.calorizen`; add a Services ID only if a web flow is introduced.                   |
| `APPLE_TEAM_ID`                            | Production          | Apple Developer team identifier used for token revocation during account deletion.                                                                                      |
| `APPLE_KEY_ID`                             | Production          | Key ID for a Sign in with Apple private key.                                                                                                                            |
| `APPLE_PRIVATE_KEY`                        | Production          | Contents of the `.p8` private key. Store as a multiline secret or with escaped `\n`; never commit the file.                                                             |
| `RESEND_API_KEY`                           | Production          | Transactional email credential used only by the API.                                                                                                                    |
| `EMAIL_FROM`                               | Production          | Verified sender, for example `CaloriZen <account@your-verified-domain>`.                                                                                                |
| `PASSWORD_RESET_URL`                       | Production          | Reset destination without a query string. `calorizen://reset-password` works for the native scheme; a verified HTTPS universal link is preferable before broad release. |
| `CORS_ORIGINS`                             | Web production only | Comma-separated HTTPS browser origins. Native app requests do not send an Origin header.                                                                                |
| `OPENAI_API_KEY` and existing AI variables | Feature-dependent   | Existing nutrition-analysis configuration; keep server-side.                                                                                                            |
| `PORT`                                     | Yes                 | API listening port supplied by the host.                                                                                                                                |

Non-production API processes use a random ephemeral JWT secret when `JWT_SECRET` is absent. That is deliberately unsuitable for a persistent environment because restarting the process invalidates sessions.

The only public mobile build variable is:

| Variable              | Required       | Purpose                                                                                                                                    |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL` | Release builds | Public HTTPS origin of the API, without `/api`, for example the production API host. Never put credentials in an `EXPO_PUBLIC_*` variable. |

## Email recovery provider

1. Verify a sender domain with Resend, including the provider's SPF and DKIM records.
2. Set `RESEND_API_KEY`, `EMAIL_FROM`, and `PASSWORD_RESET_URL` in the API secret manager.
3. If Apple private relay addresses are used, register the sending domain and sender with Apple's private email relay service.
4. Confirm the reset message reaches normal and `@privaterelay.appleid.com` addresses and that `calorizen://reset-password?token=…` opens the installed app.
5. Monitor delivery failures without logging the address, reset URL, or token. The API stores only SHA-256 token digests; tokens expire after 30 minutes and are single-use.

For a future universal-link flow, host an `apple-app-site-association` file, add the Associated Domains entitlement, change `PASSWORD_RESET_URL` to the verified HTTPS route, and validate cold-start and already-open app behavior.

## Sign in with Apple

1. In Apple Developer, confirm the App ID `com.parth.calorizen` has Sign in with Apple enabled and is grouped with the intended primary App ID.
2. Create a dedicated Sign in with Apple private key. Download it once, put it in the server secret manager, and record its key ID and team ID.
3. Configure the API variables above. The server verifies identity-token signature, issuer, audience, expiry, and subject against Apple's JWKS.
4. In Xcode, select the correct team and confirm the Sign in with Apple entitlement remains on the Release target.
5. Test a first authorization, a returning authorization, Hide My Email, canceled authorization, a deliberately invalid token, and account deletion.

Account deletion requires a fresh Apple identity token and authorization code. The API exchanges the code and calls Apple's revocation endpoint before deleting local data. If revocation is unavailable, deletion fails safely instead of silently leaving Apple authorization active.

## Existing Google and legacy Apple accounts

Google authentication is no longer callable. The migration reserves each normalized email only when exactly one historical user has that email. That user can choose **Forgot password**, prove control through the delivered email, and add an Argon2id password without creating a second account or moving meal data.

Run this audit after migration:

```sql
SELECT
  email_normalized,
  count(*) AS account_count,
  array_agg(id ORDER BY id) AS user_ids,
  array_agg(provider ORDER BY id) AS legacy_providers
FROM users
GROUP BY email_normalized
HAVING count(*) > 1
ORDER BY account_count DESC, email_normalized;
```

Ambiguous emails are intentionally absent from `account_email_addresses`, so forgot-password returns its normal generic response but sends nothing. Do not pick a row based only on the email string. Support must verify mailbox ownership and account-specific evidence, decide whether the records belong to one person, back up the affected rows, and then merge data or assign the canonical email through a reviewed one-off migration.

The old Apple endpoint trusted a client-supplied user ID and email. Therefore the migration does **not** pre-import old Apple IDs as trusted identities. On a returning Apple sign-in, the API first verifies Apple's signed token and only then recovers a unique legacy row whose stored provider ID matches the verified Apple subject. Conflicting rows are rejected for support review.

Historical JWTs do not contain the new session version claim and are rejected. Users sign in again through verified Apple authentication or email recovery.

## Xcode Cloud

The post-clone script installs Node 24, pins pnpm 10.33.1, runs `pnpm install --frozen-lockfile`, then runs `pod install --deployment` from the repository root where the workspace and Podfile live. A failed install stops the build.

In the Xcode Cloud workflow:

1. Use the repository root and shared `CaloriZen` scheme.
2. Add `EXPO_PUBLIC_API_URL` as a non-secret environment variable for Archive actions.
3. Select the Apple Developer team and App Store distribution signing. No team ID is committed to the project.
4. Confirm Xcode Cloud has permission to manage the App Store Connect app and profiles for `com.parth.calorizen`.
5. Keep API secrets on the API host; Xcode Cloud does not need `JWT_SECRET`, database, Apple private key, Resend, or OpenAI secrets.
6. Re-run the workflow after any lockfile or Podfile.lock change. Do not weaken `--frozen-lockfile` or `--deployment` to make a failing build pass.

## App Store Connect release checks

- Verify that `com.parth.calorizen` is the intended registered bundle ID and that version/build numbers are unused.
- Publish working HTTPS Terms of Service, Privacy Policy, and support URLs. The repository currently names `calorizen.ai`; confirm ownership, mailbox delivery, and the legal operator identity before submission.
- Complete App Privacy answers from the shipped behavior and `PrivacyInfo.xcprivacy`: contact info, user ID, meal/fitness data, and photos sent for app functionality; no tracking unless the shipped SDK set changes.
- Disclose OpenAI/AI image processing, Open Food Facts barcode lookup, hosting, Apple, and the transactional email provider accurately.
- Give App Review a test account that does not depend on receiving email, plus instructions for photo analysis and account deletion. Never place production credentials in repository files.
- Confirm the app has no paid subscription or in-app purchase in this version. Update the terms and App Store configuration before adding one.
- Exercise **Goals → Delete Account** on password-only, Apple-only, and combined-method accounts. Verify the user, meals, goals, credentials, aliases, reset tokens, and Apple authorization are removed.
- Validate camera and photo-library prompts on a physical device and ensure requested access matches the App Privacy answers.
- Review nutrition/medical wording and screenshots so AI estimates are presented as estimates, not medical advice.

The privacy and terms text in this repository is a technical accuracy pass, not legal advice. The operator should have counsel confirm company identity, jurisdiction, age requirements, retention commitments, and regional privacy obligations before publication.

## Dependency audit note

Production dependency overrides pin available security fixes across the server and Expo build chain. `pnpm audit --prod` still reports two high-severity advisories in the resolved `image-size@1.2.1`, reached only through `expo -> @expo/metro -> metro`; the advisory currently declares no patched release. It is a build-time image parser rather than an API runtime dependency. Keep CI inputs restricted to reviewed repository assets, do not process untrusted image files in the build pipeline, and remove the exception as soon as Expo/Metro publishes a compatible patched dependency.
