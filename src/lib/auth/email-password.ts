/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Enabled for the Leadership Access credential form. Public self-registration
 * is intentionally not exposed by the UI; leadership accounts are provisioned
 * separately and then authenticate through Better Auth.
 *
 * Do NOT edit `server.ts` for this — that file is frozen pre-wired config.
 */
export const emailAndPasswordEnabled = true;
