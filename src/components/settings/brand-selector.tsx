"use client";

import { useMemo, useState, useTransition } from "react";

import type { Brand, FavoriteBrand } from "@/lib/types";

interface BrandSelectorProps {
  brands: Brand[];
  favorites: FavoriteBrand[];
}

export const BrandSelector = ({ brands, favorites }: BrandSelectorProps) => {
  const initial = useMemo(() => new Set(favorites.map((item) => item.brand_id)), [favorites]);
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (brandId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  const save = () => {
    startTransition(async () => {
      setMessage("");

      const response = await fetch("/api/me/favorites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_ids: Array.from(selected) }),
      });

      if (!response.ok) {
        setMessage("저장 실패: 권한 또는 네트워크 상태를 확인해 주세요.");
        return;
      }

      setMessage("관심 브랜드가 저장되었습니다.");
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {brands.map((brand) => {
          const active = selected.has(brand.id);
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => toggle(brand.id)}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                active ? "border-rose-400 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p>{brand.name}</p>
              <p className="mt-1 text-xs text-slate-500">{brand.category.toUpperCase()}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "관심 브랜드 저장"}
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
};
