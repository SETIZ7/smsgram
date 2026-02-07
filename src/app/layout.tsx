// src/app/layout.tsx
import type { Metadata } from "next";
// اگه globals.css رو توی src/styles گذاشتی، اینو بذار:
import "../styles/globals.css";
// اگه globals.css کنار همین فایل (داخل app) هست:  import "./globals.css"

export const metadata: Metadata = {
  title: "smsgram",
  description: "Simple realtime chat with Next.js + WS + MongoDB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
