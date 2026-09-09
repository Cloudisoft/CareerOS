import "server-only";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

/**
 * Development fallback: logs the email instead of sending it.
 * Swapped for a real provider once RESEND_API_KEY (or SMTP config) is set.
 */
class ConsoleEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.log(
      `\n📧 [dev email] to=${payload.to} subject="${payload.subject}"\n${payload.text}\n`
    );
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(private apiKey: string, private from: string) {}

  async send(payload: EmailPayload) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend API error: ${res.status} ${await res.text()}`);
    }
  }
}

function getProvider(): EmailProvider {
  const providerName = process.env.EMAIL_PROVIDER ?? "console";
  if (providerName === "resend" && process.env.RESEND_API_KEY) {
    return new ResendEmailProvider(
      process.env.RESEND_API_KEY,
      process.env.EMAIL_FROM ?? "Career OS <no-reply@careeros.app>"
    );
  }
  return new ConsoleEmailProvider();
}

export async function sendEmail(payload: EmailPayload) {
  const provider = getProvider();
  await provider.send(payload);
}

export function emailVerificationEmail(firstName: string, verifyUrl: string): EmailPayload["html"] {
  return `
    <div style="font-family:sans-serif;background:#0D0711;padding:32px;color:#FCFBFC">
      <h1 style="color:#FCFBFC">Welcome to Career OS, ${firstName}</h1>
      <p style="color:#B8B4BA">Confirm your email to activate your account and start building your Career Profile.</p>
      <a href="${verifyUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;border-radius:8px;background:linear-gradient(135deg,#EF862D,#DF4C2C);color:white;text-decoration:none;font-weight:600">Verify email</a>
    </div>
  `;
}
