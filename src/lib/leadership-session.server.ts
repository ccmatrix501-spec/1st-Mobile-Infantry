import { useSession } from "@tanstack/react-start/server";

export type LeadershipSessionData = {
  accountId?: string;
  username?: string;
  isSuperAdmin?: boolean;
};

function sessionSecret(): string {
  const secret =
    process.env.LEADERSHIP_SESSION_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "Leadership session secret is not configured. Set LEADERSHIP_SESSION_SECRET or BETTER_AUTH_SECRET to at least 32 characters.",
    );
  }
  return secret;
}

export function useLeadershipSession() {
  return useSession<LeadershipSessionData>({
    name: "1stmi-leadership",
    password: sessionSecret(),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
    },
  });
}
