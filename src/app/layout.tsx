import type { Metadata } from "next";
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";
import Link from "next/link";

import { AppNav } from "@/components/layout/app-nav";
import { PwaRegister } from "@/components/layout/pwa-register";

import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Sale Calendar",
  description: "국내 주요 할인 행사 일정을 한 곳에 모은 모바일 우선 캘린더",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sale Calendar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,#f4faf7,35%,#eef2ff_90%)] text-slate-900">
        <PwaRegister />
        <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-6 md:px-6 md:pb-12">
          <header className="mb-5 flex items-center justify-between gap-4">
            <div>
              <Link href="/" className="text-2xl font-bold tracking-tight text-slate-900">
                Sale Calendar
              </Link>
              <p className="text-sm text-slate-600">국내 대형 할인 일정을 한눈에</p>
            </div>
            <AppNav />
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
