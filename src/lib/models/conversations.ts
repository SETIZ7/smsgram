import { getDb } from "@/lib/mongodb";

export async function getOrCreatePrivateConversation(
  userA: string,
  userB: string,
) {
  const db = await getDb();

  // ترتیب مهم نیست → سورت
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
      lastMessageAt: new Date(),
    });

    conv = {
      _id: res.insertedId,
      type: "private",
      members,
    };
  }

  return conv;
}
