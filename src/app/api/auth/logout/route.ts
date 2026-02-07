import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { parseCookie, makeCookie } from "@/lib/cookies";

export async function POST(req: Request) {
  const cookies = parseCookie(req.headers.get("cookie"));
  const token = cookies[process.env.SESSION_COOKIE_NAME!];
  if (token) await deleteSession(token);

  const res = NextResponse.json({ ok: true });
  // حذف کوکی
  res.headers.set(
    "Set-Cookie",
    makeCookie(process.env.SESSION_COOKIE_NAME!, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    })
  );
  return res;
}
