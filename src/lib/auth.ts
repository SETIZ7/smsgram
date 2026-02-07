import { randomUUID } from "crypto";
import { getDb } from "./mongodb";

const COOKIE = process.env.SESSION_COOKIE_NAME!;

export async function createSession(userId: string) {
  const db = await getDb();
  const token = randomUUID();
  await db.collection("sessions").insertOne({
    token,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 روز
  });
  return { token, cookieName: COOKIE };
}

export async function getUserBySessionCookie(cookieHeader?: string | null) {
  const { parseCookie } = await import("./cookies"); // اصلاح ESM
  const cookies = parseCookie(cookieHeader);
  const token = cookies[COOKIE];
  if (!token) return null;

  const db = await getDb();
  const session = await db.collection("sessions").findOne({ token });
  if (!session) return null;
  const user = await db.collection("users").findOne({ _id: session.userId });
  if (!user) return null;
  return { user, token };
}

export async function deleteSession(token: string) {
  const db = await getDb();
  await db.collection("sessions").deleteOne({ token });
}
