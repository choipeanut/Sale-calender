"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Brand } from "@/lib/types";

interface FilterBarProps {
  brands: Brand[];
}

const statuses = [
  { value: "", label: "전체 상태" },
  { value: "scheduled", label: "예정" },
  { value: "ongoing", label: "진행중" },
  { value: "ended", label: "종료" },
];

const categories = [
  { value: "", label: "전체 카테고리" },
  { value: "beauty", label: "뷰티" },
  { value: "fashion", label: "패션" },
  { value: "spa", label: "SPA" },
  { value: "mall", label: "종합몰" },
  { value: "national", label: "전국 행사" },
];

export const FilterBar = ({ brands }: FilterBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      brand: searchParams.get("brand") ?? "",
      category: searchParams.get("category") ?? "",
      status: searchParams.get("status") ?? "",
      favoriteOnly: searchParams.get("favorite_only") ?? "false",
    }),
    [searchParams],
  );

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());

    if (!value || value === "false") {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-5">
      <input
        placeholder="브랜드/행사명 검색"
        value={selected.q}
        onChange={(event) => update("q", event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />

      <select
        value={selected.brand}
        onChange={(event) => update("brand", event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">전체 브랜드</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>

      <select
        value={selected.category}
        onChange={(event) => update("category", event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
      >
        {categories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>

      <select
        value={selected.status}
        onChange={(event) => update("status", event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
      >
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => update("favorite_only", selected.favoriteOnly === "true" ? "false" : "true")}
        className={`rounded-xl px-3 py-2 text-sm font-medium ${
          selected.favoriteOnly === "true" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700"
        }`}
      >
        관심 브랜드만
      </button>
    </div>
  );
};
