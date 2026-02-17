"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import initNotifications from "@/lib/models/initNotifications/route.ts";

type Message = {
  _id: string; // id واقعی از DB یا tempId
  from: string;
  to: string;
  text: string;
  createdAt: string;
  tempId?: string; // فقط برای optimistic UI
  optimistic?: boolean; // پیام هنوز تایید نشده
};




export default function ChatPage() {
  const [me, setMe] = useState<string | null>(null);
  const [users, setUsers] = useState<string[]>([]);
  const [peer, setPeer] = useState<string>("");
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversId, setconversId] = useState<{id:string,name:string} | null>(null);
  const [Allconver, setAllConver] = useState<{_id:string, type: string; members :string[]}[]>([]);
  

  const wsRef = useRef<WebSocket | null>(null);
  const meRef = useRef<string | null>(null);
  const peerRef = useRef<string>("");
  const conversIdRef = useRef<{id:string,name:string} | null>(null);
  const AllconverRef = useRef<
    { _id: string; type: string; members: string[] }[]
  >([]);
  const parentHistoryRef = useRef<HTMLDivElement | null>(null);
  const inputMessageRef = useRef<HTMLInputElement | null>(null);
  const scrollPositions = useRef<Record<string, number>>({});

  const r = useRouter();


  
 function scrooldown() {
   parentHistoryRef.current?.scroll({
     top: parentHistoryRef.current.scrollHeight,
     behavior: "smooth",
   });
 } 

  // useEffect(() => {

  // }, [history]);


useEffect(() => {
  const el = parentHistoryRef.current;
  if (!el || !conversId) return;

  const saved = scrollPositions.current[conversId.id];

  if (saved !== undefined) {
    el.scrollTop = saved;
  } else {
    el.scrollTop = el.scrollHeight;
  }
      return () => {
        const el = parentHistoryRef.current;
        if (!el || !conversId) return;

        scrollPositions.current[conversId.id] = el.scrollTop;
      };
}, [conversId]);


useEffect(() => {
    conversIdRef.current = conversId!;
}, [conversId]);

useEffect(() => {
  AllconverRef.current = Allconver;
}, [Allconver]);

  // ---- sync refs (حل مشکل stale closure)
  useEffect(() => {
    meRef.current = me;
  }, [me]);

  useEffect(() => {
    peerRef.current = peer;
        setTimeout(() => {
             parentHistoryRef.current?.scroll({
               top: parentHistoryRef.current.scrollHeight,
               behavior: "instant",
             });
        }, 10);
  }, [peer]);

  // ---- WebSocket: فقط یک بار
useEffect(() => {
   initNotifications();
  fetch("/api/auth/me")
    .then((e) => e.json())
    .then((data) => {
      const protocol = location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${protocol}://${location.hostname}:3001`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const { user } = data;
      if (!user) {
        r.push("/login");
        return;
      }
      setMe(user.username);
      const username = data.user.username;

      ws.onopen = () => {
        console.log("✅ WS connected");
        (async () => {
          if (!user) {
            r.push("/login");
            return;
          }

          const userNameRes = await fetch(
            `/api/Conversation?userId=${username}`,
          );
          const userNameData = await userNameRes.json();

          setAllConver(userNameData);
          console.log(userNameData);
          // console.log(username, me);
          ws.send(
            JSON.stringify({
              type: "register",
              from: username, // مثلاً "user1"
            }),
          );
          const uRes = await fetch("/api/users");
          const uData = await uRes.json();
          setUsers(uData.users.filter((u: string) => u !== username));
        })();
      };

      wsRef.current!.onmessage = (e: MessageEvent) => {
        try {
          const data: {
            type: "message:ack" | "message" ;
            message: {
              _id: string;
              from: string;
              to: string;
              text: string;
              conversId: string;
              createdAt: string;
              tempId?: string;
              optimistic?: boolean;
            };
          } = JSON.parse(e.data);

          // data.message.from
          console.log(AllconverRef, data);


          if (data.type === "message:ack") {
            const realMsg = data.message;

            setHistory((h) =>
              h.map((m) => (m._id === realMsg.tempId ? realMsg : m)),
            );
          }

          if (data.type === "message") {

            // AllconverRef.current.find((e)=>{
            //   return e.members
            // })
            //  setAllConver([...AllconverRef.current]);
            if (data.message.from === peerRef.current) {
              setHistory((h) => [...h, data.message]);
            }
          }
        } catch (err) {
          console.error("WS message parse error:", err);
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
}, []);

  // ---- انتخاب مخاطب
async function pickPeer(u: string) {
  inputMessageRef.current?.focus();
  setPeer(u);
  // setconversId(u)
  const res = await fetch(
    `/api/messages/history?with=${encodeURIComponent(u)}`,
  );
  const data = await res.json();

  if (data.error) {
    console.warn("User not found or error:", data.error);
    setHistory([]); // clear previous messages
    return;
  }

  setHistory(data.messages);
}

  // ---- انتخاب مکالمه
async function pickConv(id: string, name: string) {
  inputMessageRef.current?.focus();
  setPeer(name);
  setconversId({id,name});
  const res = await fetch(
    `/api/messages/history?with=${encodeURIComponent(id)}`,
  );
  const data = await res.json();

  if (data.error) {
    console.warn("User not found or error:", data.error);
    setHistory([]); // clear previous messages
    return;
  }

  setHistory(data.messages);
}



  // ---- ارسال پیام
 async function send() {

    if (!conversId || !input.trim()) return;

    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket not open");
      return;
    }

    const text = input;
    setInput("");

    setTimeout(() => {
      scrooldown();
    }, 10);

    // optimistic UI
    const optimisticMsg = {
      _id: uuidv4(),
      from: meRef.current!,
      to: conversId.name,
      text,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setHistory((h) => [...h, optimisticMsg]);

  // const conversId =  await getOrCreatePrivateConversation(meRef.current!,peer)

 const convId = await fetch("/api/Conversation", {
   method: "POST",
   body: JSON.stringify({ userA: meRef.current!, userB: peer }),
 }).then((e) => e.json());


 console.log(convId);

    wsRef.current.send(
      JSON.stringify({
        type: "private_message",
        from: meRef.current, // userId یا username (باید با بک‌اند یکی باشه)
        to: peer,
        conversId:convId._id,
        text,
        tempId: optimisticMsg._id, // 👈 خیلی مهم
      }),
    );

    // wsRef.current.send(
    //   JSON.stringify({
    //     type: "private",
    //     from: meRef.current, // userId یا username (باید با بک‌اند یکی باشه)
    //     to: peer,
    //     text,
    //     tempId: optimisticMsg._id, // 👈 خیلی مهم
    //   }),
    // );
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  }

  const title = useMemo(
    () => (peer ? `چت با ${peer}` : "یک مخاطب انتخاب کن"),
    [peer],
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

        <div className="text-sm text-gray-500">
          {" "}
          {users.length} کاربران تعداد{" "}
        </div>
        <div className="flex">
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
          </div>

          <div className="space-y-1">
            {[...Allconver]
              .filter((u) => u.type === "private")
              .map((u) => (
                <button
                  key={u._id}
                  onClick={() => {
                    // const otherUser = u.members.find((mem) => mem !== me);
                    // if (otherUser)
                    pickConv(
                      u._id,
                      u.members.find((mem) => mem !== me) || "Unknown",
                    );
                    console.log(Allconver, u);
                  }}
                  className={
                    "w-full text-left p-2 rounded " +
                    (conversIdRef.current?.id === u._id
                      ? "bg-black text-white"
                      : "hover:bg-gray-100")
                  }
                >
                  {u.members.find((mem) => mem !== me) || "Unknown"}
                </button>
              ))}
          </div>
        </div>

        {users.length === 0 && (
          <div className="text-xs text-gray-400">
            لطفا دکمه جست و جو را برای چت با یک کاربر بفشارید!
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="border-b p-3 font-medium">{title}</header>

        <div
          key={peer}
          id="parentHistoryId"
          ref={parentHistoryRef}
          className="flex-1 p-3 overflow-y-auto space-y-2 relative"
        >
          {history.map((m, i) => (
            <div
              key={i}
              className={`max-w-[70%] p-2 rounded ${
                m.from === me ? "ml-auto bg-gray-500 text-black" : "bg-gray-300"
              }`}
            >
              <div className="text-xs opacity-60">{m.from}</div>
              <div>{m.text}</div>
            </div>
          ))}

          {!peer && (
            <div className="text-gray-400">از ستون چپ یک مخاطب انتخاب کن.</div>
          )}

          <div
            className="fixed left-[3vw] bottom-[6vw] rounded-full p-2 bg-amber-100 text-[2vw] cursor-pointer"
            onClick={() => scrooldown()}
          >
            {" "}
            ⬇️{" "}
          </div>
        </div>

        <div className="border-t p-3 flex gap-2">
          <input
            ref={inputMessageRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={
              conversId?.name
                ? `پیام به ${conversId.name}...`
                : "اول مخاطب را انتخاب کن"
            }
            disabled={!conversId?.id}
            className="flex-1 border rounded p-2"
          />

          <button
            onClick={send}
            disabled={!conversId?.id || !input.trim()}
            className="px-4 rounded bg-black text-white disabled:opacity-40"
          >
            ارسال
          </button>
        </div>
      </main>
    </div>
  );
}
