import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserBySessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getUserBySessionCookie(req.headers.get("cookie"));
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const withUser = url.searchParams.get("with");
  if (!withUser)
    return NextResponse.json(
      { error: "Param 'with' required" },
      { status: 400 }
    );

  const me = session.user._id;
  const db = await getDb();
  const msgs = await db
    .collection("messages")
    .find({
      $or: [
        { from: me, to: withUser },
        { from: withUser, to: me },
      ],
    })
    .sort({ createdAt: 1 })
    .toArray();

  return NextResponse.json({ messages: msgs });
}
