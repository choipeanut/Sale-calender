import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">온보딩</h1>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>관심 브랜드 3개 이상 선택</li>
        <li>알림 권한 허용 및 웹 푸시 등록</li>
        <li>캘린더 필터로 내 관심 행사만 보기</li>
      </ol>
      <div className="flex flex-wrap gap-2">
        <Link href="/settings/brands" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          관심 브랜드 설정
        </Link>
        <Link href="/settings/notifications" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          알림 설정
        </Link>
      </div>
    </div>
  );
}
