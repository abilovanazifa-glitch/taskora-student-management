import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("Japanese landing renders hero and features", async ({ page }) => {
    await page.goto("/ja");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "ログイン" })).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "新規登録" })).toBeVisible();
  });

  test("Uzbek landing renders hero", async ({ page }) => {
    await page.goto("/uz");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("skip link targets main content", async ({ page }) => {
    await page.goto("/ja");
    const skipLink = page.getByRole("link", { name: /メインコンテンツ|Asosiy kontent/i });
    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });
});
