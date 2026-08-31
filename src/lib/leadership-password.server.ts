import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashLeadershipPassword(password: string): Promise<string> {
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters.");
  }
  const salt = randomBytes(16).toString("base64url");
  const key = await derive(password, salt);
  return `scrypt$${salt}$${key.toString("base64url")}`;
}

export async function verifyLeadershipPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, salt, encoded] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !encoded) {
    // Keep failure timing less distinguishable from a real password check.
    await derive(password, "invalid-leadership-password-hash");
    return false;
  }

  const expected = Buffer.from(encoded, "base64url");
  const actual = await derive(password, salt);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
