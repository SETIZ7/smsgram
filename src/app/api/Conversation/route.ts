import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";

 async function getOrCreatePrivateConversation(
  userA: string,
  userB: string,
) {
  const db = await getDb();

  const members = [userA, userB].sort();

  let conv = await db.collection("conversations").findOne({
    type: "private",
    members,
  });

  if (!conv) {
    const res = await db.collection("conversations").insertOne({
      type: "private",
      name: "",
      members,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    conv = {
      _id: res.insertedId,
      type: "private",
      members,
    };
  }

  return conv;
}

export async function POST(req: Request) {
  const { userA, userB } = await req.json();

  const conv = await getOrCreatePrivateConversation(userA, userB);

  return NextResponse.json(conv);
}


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const db = await getDb();

  const conversations = await db
    .collection("conversations")
    .find({ members: userId })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json(conversations);
}
