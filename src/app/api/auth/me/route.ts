import { NextResponse } from "next/server";
import { getUserBySessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const { user } =
    (await getUserBySessionCookie(req.headers.get("cookie"))) || {};
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { username: user._id } });
}
