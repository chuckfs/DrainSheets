import { Resend } from "resend";

export type EmailConfig = {
  apiKey: string;
  fromEmail: string;
};

export function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !fromEmail) {
    return null;
  }

  return { apiKey, fromEmail };
}

export function createResendClient(config: EmailConfig): Resend {
  return new Resend(config.apiKey);
}
