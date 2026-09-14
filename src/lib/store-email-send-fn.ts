import { createServerFn } from "@tanstack/react-start";

export type StoreEmailSendInput = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text: string;
  html: string;
};

export type StoreEmailSendResult = {
  ok: true;
  id: string | null;
  from: string;
  to: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function splitRecipients(value: unknown): string[] {
  const recipients = String(value ?? "")
    .split(/[;,]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(recipients)];
}

function validateRecipients(value: unknown, label: string, required = false): string[] {
  const recipients = splitRecipients(value);
  if (required && recipients.length === 0) throw new Error(`${label} is required.`);
  if (recipients.length > 20) throw new Error(`${label} has too many recipients.`);
  const invalid = recipients.find((email) => !EMAIL_RE.test(email) || email.length > 254);
  if (invalid) throw new Error(`${label} contains an invalid email address.`);
  return recipients;
}

function cleanSubject(value: unknown): string {
  const subject = String(value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 300);
  return subject || "1st M.I. Merchandise";
}

function mailFrom(): string {
  return (
    process.env.STORE_MAIL_FROM?.trim() ||
    process.env.MAIL_FROM?.trim() ||
    "merch@1stmid.com"
  );
}

function mailFromName(): string {
  return process.env.STORE_MAIL_FROM_NAME?.trim() || "1st M.I. Merchandise";
}

export const sendLeadershipStoreEmail = createServerFn({ method: "POST" })
  .inputValidator((input: StoreEmailSendInput) => input)
  .handler(async ({ data }): Promise<StoreEmailSendResult> => {
    const leadership = await import("@/lib/local-leadership-access.server");
    await leadership.requireLocalLeadership();

    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (!resendKey) {
      throw new Error(
        "Store email sending is not configured. Add RESEND_API_KEY to this Vercel project's Production environment and redeploy.",
      );
    }

    const to = validateRecipients(data.to, "To", true);
    const cc = validateRecipients(data.cc, "Cc");
    const bcc = validateRecipients(data.bcc, "Bcc");
    const subject = cleanSubject(data.subject);
    const text = String(data.text ?? "").trim();
    const html = String(data.html ?? "").trim();

    if (!text && !html) throw new Error("Email body is empty.");
    if (text.length > 500_000 || html.length > 1_500_000) {
      throw new Error("Email content is too large to send from the Store Manager.");
    }

    const fromAddress = mailFrom();
    if (!EMAIL_RE.test(fromAddress)) throw new Error("STORE_MAIL_FROM / MAIL_FROM is not a valid email address.");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          "User-Agent": "1st-Mobile-Infantry-Store/1.0",
        },
        body: JSON.stringify({
          from: `${mailFromName()} <${fromAddress}>`,
          to,
          ...(cc.length ? { cc } : {}),
          ...(bcc.length ? { bcc } : {}),
          subject,
          ...(text ? { text } : {}),
          ...(html ? { html } : {}),
          reply_to: fromAddress,
        }),
        signal: controller.signal,
      });

      const result = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(
          result.error?.message || result.message || `Resend returned HTTP ${response.status}.`,
        );
      }

      return {
        ok: true,
        id: result.id ?? null,
        from: fromAddress,
        to,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Resend timed out while sending the email. Try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  });
