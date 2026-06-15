import { createHash, randomBytes } from "crypto";

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildInviteUrl(token: string, appUrl: string): string {
  return `${appUrl}/signup?token=${token}`;
}
