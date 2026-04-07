import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">오프라인 상태입니다</h1>
      <p className="mt-3 text-sm text-slate-600">네트워크 연결 후 새로고침하면 최신 행사 데이터를 불러옵니다.</p>
      <Link href="/" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
        홈으로
      </Link>
    </div>
  );
}
