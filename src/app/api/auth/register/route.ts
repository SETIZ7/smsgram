import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword } from "@/lib/crypto";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password)
    return NextResponse.json({ error: "Bad input" }, { status: 400 });

  const db = await getDb();
  const exist = await db.collection("users").findOne({ _id: username });
  if (exist)
    return NextResponse.json({ error: "Username exists" }, { status: 409 });

  const passhash = await hashPassword(password);
  await db
    .collection("users")
    .insertOne({ _id: username, passhash, createdAt: new Date() });

  return NextResponse.json({ ok: true });
}
