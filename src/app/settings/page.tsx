import Link from "next/link";

export default function SettingsIndexPage() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">설정</h1>
      <div className="flex gap-2">
        <Link href="/settings/brands" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          관심 브랜드
        </Link>
        <Link href="/settings/notifications" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          알림 설정
        </Link>
      </div>
    </div>
  );
}
