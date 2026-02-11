import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserBySessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getUserBySessionCookie(req.headers.get("cookie"));
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const users = await db
    .collection("users")
    .find({}, { projection: { username: 1 } })
    .toArray();
  return NextResponse.json({ users: users.map((u) => u.username) });
}
