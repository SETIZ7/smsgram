"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  from: string;
  to: string;
  text: string;
  createdAt?: string;
};

export default function ChatPage() {
  const [me, setMe] = useState<string | null>(null);
  const [users, setUsers] = useState<string[]>([]);
  const [peer, setPeer] = useState<string>("");
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const meRef = useRef<string | null>(null);
  const peerRef = useRef<string>("");

  const r = useRouter();

  // ---- sync refs (حل مشکل stale closure)
  useEffect(() => {
    meRef.current = me;
  }, [me]);

  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  // ---- WebSocket: فقط یک بار
  useEffect(() => {
    // let ws: WebSocket;
    
    fetch("/api/socket").then(() => {
      const ws = new WebSocket("ws://localhost:3001");
      
      wsRef.current = ws;
      
      (async () => {
      const meRes = await fetch("/api/auth/me");
      const { user } = await meRes.json();
      
      if (!user) {
      r.push("/login");
      return;
      }
      
      setMe(user.username);
      console.log(user.username , me);
                ws.send(
                  JSON.stringify({
                    type: "register",
                    from: user.username, // مثلاً "user1"
                  })
                );
      const uRes = await fetch("/api/users");
      const uData = await uRes.json();
      setUsers(uData.users.filter((u: string) => u !== user.username));
      })();

      ws.onopen = () => {
        console.log("✅ WS connected");

      };

      ws.onmessage = (ev) => {
        // console.log(ev,'ssslll')
        const data = JSON.parse(ev.data);
        try {
  if (data.type === "private" || data.type === "broadcast") {
    console.log("📩", data.from, data.text);
  }
          // if (data.type === "send") {

          //   console.log(data.body, peerRef.current);

            
            // const m: Message = {
            //   from: data.from,
            //   to: data.to,
            //   body: data.body,
            // };

            // فقط پیام‌های مربوط به چت فعال
            // if (data.from === peerRef.current || data.to === peerRef.current) {
            //   setHistory((h) => [...h, m]);
            // }
          // }
        } catch (err) {
          console.error("❌ WS message parse error", err);
        }
      };

      ws.onclose = () => {
        console.log("⚠️ WS closed");
      };

      ws.onerror = (err) => {
        console.error("❌ WS error", err);
      };
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []); // ✅ مهم: بدون dependency

  // ---- گرفتن اطلاعات کاربر و کاربران
  // useEffect(() => {
  //   (async () => {
  //     const meRes = await fetch("/api/auth/me");
  //     const { user } = await meRes.json();

  //     if (!user) {
  //       r.push("/login");
  //       return;
  //     }

  //     setMe(user.username);

  //     const uRes = await fetch("/api/users");
  //     const uData = await uRes.json();
  //     setUsers(uData.users.filter((u: string) => u !== user.username));
  //   })();
  // }, [r]);

  // ---- انتخاب مخاطب
  async function pickPeer(u: string) {
    setPeer(u);

    const res = await fetch(
      `/api/messages/history?with=${encodeURIComponent(u)}`
    );
    const data = await res.json();
    setHistory(data.messages);
  }

  // ---- ارسال پیام
  function send() {
    if (!peer || !input.trim()) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "private",
          from:me,
          to: peer,
          text: input,
        })
      );

      // optimistic UI
      setHistory((h) => [
        ...h,
        { from: meRef.current!, to: peer, text: input },
      ]);

      setInput("");
    } else {
      console.error("❌ WebSocket not open");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  }

  const title = useMemo(
    () => (peer ? `چت با ${peer}` : "یک مخاطب انتخاب کن"),
    [peer]
  );

  return (
    <div className="h-screen flex">
      <aside className="w-64 border-r p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{me}</div>
          <button onClick={logout} className="text-sm underline">
            خروج
          </button>
        </div>

        <div className="text-sm text-gray-500">کاربران</div>

        <div className="space-y-1">
          {users.map((u) => (
            <button
              key={u}
              onClick={() => pickPeer(u)}
              className={
                "w-full text-left p-2 rounded " +
                (peer === u ? "bg-black text-white" : "hover:bg-gray-100")
              }
            >
              {u}
            </button>
          ))}

          {users.length === 0 && (
            <div className="text-xs text-gray-400">
              فعلاً کاربر دیگری نیست. یک مرورگر دیگر باز کن و ثبت‌نام کن.
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="border-b p-3 font-medium">{title}</header>

        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {history.map((m, i) => (
            <div
              key={i}
              className={`max-w-[70%] p-2 rounded ${
                m.from === me ? "ml-auto bg-black text-white" : "bg-gray-100"
              }`}
            >
              <div className="text-xs opacity-60">{m.from}</div>
              <div>{m.text}</div>
            </div>
          ))}

          {!peer && (
            <div className="text-gray-400">از ستون چپ یک مخاطب انتخاب کن.</div>
          )}
        </div>

        <div className="border-t p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={peer ? `پیام به ${peer}...` : "اول مخاطب را انتخاب کن"}
            disabled={!peer}
            className="flex-1 border rounded p-2"
          />

          <button
            onClick={send}
            disabled={!peer || !input.trim()}
            className="px-4 rounded bg-black text-white disabled:opacity-40"
          >
            ارسال
          </button>
        </div>
      </main>
    </div>
  );
}
