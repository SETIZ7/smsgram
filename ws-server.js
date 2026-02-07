const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 3001 });

// userId -> WebSocket
const clients = new Map();

console.log("🚀 WS server on ws://localhost:3001");

wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());

    /**
     * msg = {
     *   type: "register" | "private" | "broadcast",
     *   from: "user1",
     *   to?: "user2",
     *   text: "hello"
     * }
     */

    // 1️⃣ ثبت یوزر
    if (msg.type === "register") {
      clients.set(msg.from, ws);
      console.log(`🆔 Registered user: ${msg.from}`);
      return;
    }

    // 2️⃣ پیام خصوصی
    if (msg.type === "private") {
      const targetWs = clients.get(msg.to);
      console.log(msg);
      if (targetWs) {
        targetWs.send(
          JSON.stringify({
            type: "private",
            from: msg.from,
            text: msg.text,
          })
        );
      }
      return;
    }

    // 3️⃣ پیام به همه
    if (msg.type === "broadcast") {
      for (const [userId, client] of clients.entries()) {
        if (client.readyState === client.OPEN) {
          client.send(
            JSON.stringify({
              type: "broadcast",
              from: msg.from,
              text: msg.text,
            })
          );
        }
      }
    }
  });

  ws.on("close", () => {
    // حذف یوزر قطع‌شده
    for (const [userId, socket] of clients.entries()) {
      if (socket === ws) {
        clients.delete(userId);
        console.log(`⚠️ ${userId} disconnected`);
        break;
      }
    }
  });
});
