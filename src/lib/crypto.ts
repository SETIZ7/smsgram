import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
const scrypt = promisify(_scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [saltHex, hashHex] = hash.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const derived = Buffer.from(hashHex, "hex");
  const check = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(derived, check);
}
