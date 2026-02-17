import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserBySessionCookie } from "@/lib/auth";
import { ObjectId } from "mongodb";
    
    interface UserDoc {
      username: string;
      passhash: string;
      // [key: string]: any;
    }

export async function GET(req: Request) {
  try {
    const session = await getUserBySessionCookie(req.headers.get("cookie"));
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const withUserParam = url.searchParams.get("with");
    if (!withUserParam)
      return NextResponse.json(
        { error: "Param 'with' required" },
        { status: 400 },
      );

    const db = await getDb();


    const withUserDoc = await db
      .collection<UserDoc>("conversations")
      .findOne({ _id: new ObjectId(withUserParam) });

    // 1️⃣ پیدا کردن user مقصد

    if (!withUserDoc)
      return NextResponse.json(
        { error: "conversations not found" },
        { status: 404 },
      );

    // const meId = session.user.username;
    const withUserId = withUserDoc._id

    // 2️⃣ گرفتن پیام‌ها
    const msgs = await db
      .collection("messages")
      .find({conversId: withUserId
      })
      .sort({ createdAt: 1 })
      .toArray();

    // 3️⃣ تبدیل ObjectId به string برای فرانت
    const safeMsgs = msgs.map((m) => ({
      ...m,
      _id: m._id.toString(),
      from: m.from.toString(),
      to: m.to.toString(),
    }));

    return NextResponse.json({ messages: safeMsgs });
  } catch (err) {
    console.error("Error in /messages/history:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
