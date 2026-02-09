import { WebSocketServer } from "ws";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-expect-error -- library typing is wrong
  if (!res.socket.server.wss) {
    console.log("🔌 Starting WS...");

    // @ts-expect-error -- library typing is wrong
    const wss = new WebSocketServer({ server: res.socket.server });

    wss.on("connection", (ws) => {
      console.log("✅ Client connected");

      ws.on("message", (msg) => {
        console.log("📩 Received:", msg.toString());
      });

      ws.on("close", () => {
        console.log("⚠️ Client disconnected");
      });
    });

    // wss.on("connection", (socket) => {
    //   console.log("✅ Client connected");

    //   socket.on("message", (msg) => {
    //     const messageText = msg.toString();

    //     // 📌 اینجا لاگ اضافه کردیم
    //     console.log(`📩 پیام جدید دریافت شد: ${messageText}`);

    //     // جواب به فرستنده
    //     socket.send(`Echo: ${messageText}`);
    //   });
    // });

    // @ts-expect-error -- library typing is wrong
    res.socket.server.wss = wss;
  }

  res.end();
}

// import type { NextApiRequest, NextApiResponse } from "next";
// import { WebSocketServer } from "ws";
// import { parseCookie } from "@/lib/cookies";
// import { getDb } from "@/lib/mongodb";

// // نگه‌داری اتصال‌ها بر اساس username
// const clients = new Map<string, Set<WebSocket>>();

// export const config = { api: { bodyParser: false } };

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   // فقط یکبار WebSocketServer بساز
//   // @ts-ignore
//   if (!res.socket.server.wss) {
//     console.log("🔌 Starting WS...");
//     // @ts-ignore
//     const wss = new WebSocketServer({ server: res.socket.server });

//     wss.on("connection", async (socket, request) => {
//       const cookies = parseCookie(request.headers.cookie || "");
//       const token = cookies[process.env.SESSION_COOKIE_NAME!];

//       const db = await getDb();
//       const sess = token
//         ? await db.collection("sessions").findOne({ token })
//         : null;
//       const username = sess?.userId as string | undefined;

//       if (!username) {
//         socket.close();
//         return;
//       }

//       if (!clients.has(username)) clients.set(username, new Set());
//       clients.get(username)!.add(socket as unknown as WebSocket);

//       socket.on("message", async (raw) => {
//         try {
//           const data = JSON.parse(raw.toString()) as {
//             type: string;
//             to?: string;
//             body?: string;
//           };
//           if (data.type === "send" && data.to && data.body) {
//             await db.collection("messages").insertOne({
//               from: username,
//               to: data.to,
//               body: data.body,
//               createdAt: new Date(),
//             });

//             // ارسال به گیرنده
//             const recSet = clients.get(data.to);
//             if (recSet) {
//               recSet.forEach((ws) => {
//                 if ((ws as any).readyState === 1) {
//                   ws.send(
//                     JSON.stringify({
//                       type: "message",
//                       from: username,
//                       body: data.body,
//                     })
//                   );
//                 }
//               });
//             }

//             // تایید برای فرستنده
//             if ((socket as any).readyState === 1) {
//               socket.send(
//                 JSON.stringify({ type: "sent", to: data.to, body: data.body })
//               );
//             }
//           }
//         } catch {}
//       });

//       socket.on("close", () => {
//         const set = clients.get(username);
//         if (set) {
//           set.delete(socket as unknown as WebSocket);
//           if (set.size === 0) clients.delete(username);
//         }
//       });
//     });

//     // @ts-ignore
//     res.socket.server.wss = wss;
//   }
//   res.end();
// }
