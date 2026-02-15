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