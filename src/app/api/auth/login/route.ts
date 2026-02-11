import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/crypto";
import { createSession } from "@/lib/auth";
import { makeCookie } from "@/lib/cookies";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password)
    return NextResponse.json({ error: "Bad input" }, { status: 400 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ username: username });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await verifyPassword(password, user.passhash);
  if (!ok)
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });

  const { token, cookieName } = await createSession(username);
  const res = NextResponse.json({ ok: true, username });
  res.headers.set(
    "Set-Cookie",
    makeCookie(cookieName, token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  );
  return res;
}
