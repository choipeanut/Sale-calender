"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/", label: "홈" },
  { href: "/calendar", label: "캘린더" },
  { href: "/upcoming", label: "다가오는 행사" },
  { href: "/settings/brands", label: "관심 브랜드" },
  { href: "/settings/notifications", label: "알림" },
  { href: "/admin", label: "관리자" },
];

export const AppNav = () => {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden md:flex md:items-center md:gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-medium transition",
              pathname === item.href
                ? "bg-slate-900 text-white"
                : "bg-white/80 text-slate-700 hover:bg-slate-100",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="fixed bottom-4 left-1/2 z-40 flex w-[min(100%-1.5rem,28rem)] -translate-x-1/2 items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-xl md:hidden">
        {items.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-2 py-2 text-xs font-medium",
              pathname === item.href ? "bg-slate-900 text-white" : "text-slate-600",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
};
