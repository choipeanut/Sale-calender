import { expect, test } from "@playwright/test";

test("MVP E2E flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sale Calendar" })).toBeVisible();

  await page.getByRole("link", { name: "온보딩 시작" }).click();
  await expect(page.getByRole("heading", { name: "온보딩" })).toBeVisible();

  await page.getByRole("link", { name: "관심 브랜드 설정" }).click();
  await expect(page.getByRole("heading", { name: "관심 브랜드 설정" })).toBeVisible();

  await page.getByRole("button", { name: "올리브영" }).click();
  await page.getByRole("button", { name: "무신사" }).click();
  await page.getByRole("button", { name: "29CM" }).click();
  await page.getByRole("button", { name: "관심 브랜드 저장" }).click();
  await expect(page.getByText("관심 브랜드가 저장되었습니다.")).toBeVisible();

  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "월간 캘린더" })).toBeVisible();

  const detailLink = page.locator('a[href^="/events/"]').first();
  await detailLink.click();
  await expect(page.getByText("출처 목록")).toBeVisible();

  await page.goto("/settings/notifications");
  await page.getByRole("button", { name: "알림 설정 저장" }).click();
  await expect(page.getByText("알림 설정이 저장되었습니다.")).toBeVisible();

  await page.goto("/admin");
  await page.getByRole("button", { name: "선택 이벤트 승인" }).click();
  await expect(page.getByText("이벤트 상태를 승인(verified)으로 갱신했습니다.")).toBeVisible();

  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "리스트 보기" })).toBeVisible();
});
