import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-slate-600">주소를 확인하거나 캘린더 홈으로 이동해 주세요.</p>
      <Link href="/" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
        홈으로 이동
      </Link>
    </div>
  );
}
