"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const r = useRouter();

  async function submit() {
    const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      if (mode === "register") {
        // بعد از ثبت‌نام، ورود کن
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
      }
      r.push("/chat");
    } else {
      alert((await res.json()).error || "Error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded p-4 space-y-4">
        <h1 className="text-xl font-semibold">
          {mode === "register" ? "ثبت‌نام" : "ورود"}
        </h1>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="نام کاربری"
          className="border w-full p-2 rounded"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور"
          className="border w-full p-2 rounded"
          type="password"
        />
        <button
          onClick={submit}
          className="w-full p-2 rounded bg-black text-white"
        >
          {mode === "register" ? "ساخت حساب" : "ورود"}
        </button>
        <button
          onClick={() => setMode(mode === "register" ? "login" : "register")}
          className="w-full p-2 rounded border"
        >
          {mode === "register" ? "حساب داری؟ ورود" : "حساب نداری؟ ثبت‌نام"}
        </button>
      </div>
    </div>
  );
}
