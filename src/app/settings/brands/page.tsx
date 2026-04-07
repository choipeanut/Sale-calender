import { BrandSelector } from "@/components/settings/brand-selector";
import { repository } from "@/lib/repositories/repository";

export default async function BrandSettingsPage() {
  const [brands, favorites] = await Promise.all([
    repository.listBrands(),
    repository.listFavorites("demo-user"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">관심 브랜드 설정</h1>
      <p className="text-sm text-slate-600">홈 개인화, 다가오는 행사 우선 노출, 알림 대상 계산에 사용됩니다.</p>
      <BrandSelector brands={brands} favorites={favorites} />
    </div>
  );
}
