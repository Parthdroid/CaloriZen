const RESEND_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function buildResetUrl(token: string): string {
  const baseUrl = process.env.PASSWORD_RESET_URL;
  if (!baseUrl) {
    throw new Error("PASSWORD_RESET_URL is not configured");
  }

  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string | null;
  token: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error(
      "RESEND_API_KEY and EMAIL_FROM are required to send password reset email",
    );
  }

  const resetUrl = buildResetUrl(input.token);
  const greeting = input.name ? `Hi ${escapeHtml(input.name)},` : "Hi,";
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Reset your CaloriZen password",
      html: `<p>${greeting}</p><p>Use the secure link below to reset your CaloriZen password. It expires in 30 minutes and can only be used once.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      text: `${input.name ? `Hi ${input.name},` : "Hi,"}\n\nReset your CaloriZen password using this link (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider rejected the request (${response.status})`);
  }
}

export function assertEmailConfiguration(): void {
  if (
    !process.env.PASSWORD_RESET_URL ||
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM
  ) {
    throw new Error(
      "PASSWORD_RESET_URL, RESEND_API_KEY, and EMAIL_FROM are required in production",
    );
  }
}
