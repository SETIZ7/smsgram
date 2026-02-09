const { WebSocketServer } = require("ws");
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/smsgram"; // رشته اتصال به DB
const client = new MongoClient(uri);
let db;

async function initDb() {
  await client.connect();
  db = client.db("smsgram"); // نام دیتابیس خودت
}
initDb();

const clients = new Map();
const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (ws) => {
  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type !== "private" || !msg.from || !msg.to || !msg.text) return;

    clients.set(msg.from, ws);

    // ذخیره در MongoDB
    const messageDoc = {
      from: msg.from,
      to: msg.to,
      text: msg.text,
      createdAt: new Date(),
    };
    const result = await db.collection("messages").insertOne(messageDoc);

    const savedMessage = {
      _id: result.insertedId.toString(),
      ...messageDoc,
      tempId: msg.tempId,
      createdAt: messageDoc.createdAt.toISOString(),
    };

    // تایید به فرستنده
    ws.send(JSON.stringify({ type: "message:ack", message: savedMessage }));

    // ارسال به گیرنده اگر آنلاینه
    const targetWs = clients.get(msg.to);
    if (targetWs)
      targetWs.send(JSON.stringify({ type: "message", message: savedMessage }));
  });

  ws.on("close", () => {
    for (const [userId, socket] of clients.entries())
      if (socket === ws) clients.delete(userId);
  });
});
