const { WebSocketServer } = require("ws");
const { MongoClient, ObjectId } = require("mongodb");

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

let messageDoc, result, savedMessage, targetWs;

wss.on("connection", (ws) => {
  ws.on("message", async (raw) => {
    
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    
    if ( !msg.from || !msg.to || !msg.text) return;
    
    clients.set(msg.from, ws);

    switch (msg.type) {
      case "private":


        // ذخیره در MongoDB
        messageDoc = {
          from: msg.from,
          to: msg.to,
          text: msg.text,
          createdAt: new Date(),
        };
        result = await db.collection("messages").insertOne(messageDoc);

        savedMessage = {
          _id: result.insertedId.toString(),
          ...messageDoc,
          tempId: msg.tempId,
          createdAt: messageDoc.createdAt.toISOString(),
        };

        // تایید به فرستنده
        ws.send(JSON.stringify({ type: "message:ack", message: savedMessage }));

        // ارسال به گیرنده اگر آنلاینه
        targetWs = clients.get(msg.to);
        if (targetWs)
          targetWs.send(
            JSON.stringify({ type: "message", message: savedMessage }),
          );

        break;
      case "private_message":
 try {

if (!ObjectId.isValid(msg.conversId)) {
  ws.send(JSON.stringify({ type: "error", message: "Invalid conversId" }));
  break;
}

    const conversId = new ObjectId(msg.conversId);

    // 1️⃣ ذخیره پیام
    const messageDoc = {
      conversId,
      from: msg.from,
      to: msg.to,
      text: msg.text,
      createdAt: new Date(),
    };

    const result = await db.collection("messages").insertOne(messageDoc);

    // 2️⃣ آپدیت conversation
    await db.collection("conversations").updateOne(
      { _id: conversId },
      {
        $set: {
          updatedAt: new Date(),
          lastMessage: {
            from: msg.from,
            text: msg.text,
            createdAt: messageDoc.createdAt,
          },
        },
      },
    );

    const savedMessage = {
      _id: result.insertedId.toString(),
      ...messageDoc,
      conversId,
      tempId: msg.tempId,
      createdAt: messageDoc.createdAt.toISOString(),
    };

    // 3️⃣ گرفتن conversation
    const conv = await db.collection("conversations").findOne({
      _id: conversId,
    });

    if (!conv) {
      ws.send(JSON.stringify({ type: "error", message: "Conversation not found" }));
      break;
    }

    // 4️⃣ broadcast به همه اعضا
    conv.members.forEach((memberId) => {
      console.log(memberId, msg.from);
      if(memberId==msg.from){
        return;
      }
      const memberWs = clients.get(memberId);

      if (memberWs && memberWs.readyState === 1) {
        memberWs.send(
          JSON.stringify({
            type: "message",
            conversId: msg.conversId,
            message: savedMessage,
          }),
        );
      }
    });

    // 5️⃣ ack فقط به sender
    ws.send(
      JSON.stringify({
        type: "message:ack",
        tempId: msg.tempId,
        message: savedMessage,
      })
    );

  } catch (err) {
    console.error("private_message error:", err);
    ws.send(JSON.stringify({ type: "error", message: "Message failed" }));
  }

      default:
        break;
    }
    
    
  });

  ws.on("close", () => {
    for (const [userId, socket] of clients.entries())
      if (socket === ws) clients.delete(userId);
  });
});
