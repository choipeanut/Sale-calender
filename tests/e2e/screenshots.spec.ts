import { test } from "@playwright/test";

const artifacts = [
  { path: "/", file: "docs/phase-1-screenshots/home.png" },
  { path: "/calendar", file: "docs/phase-1-screenshots/calendar.png" },
  { path: "/upcoming", file: "docs/phase-1-screenshots/upcoming.png" },
  { path: "/settings/brands", file: "docs/phase-1-screenshots/brand-settings.png" },
  { path: "/admin", file: "docs/phase-1-screenshots/admin.png" },
];

test("capture phase-1 screenshots", async ({ page }) => {
  for (const target of artifacts) {
    await page.goto(target.path);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: target.file, fullPage: true });
  }
});
