import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test("unknown route shows not found content", async ({ page }) => {
    await page.goto("/ja/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: /見つかりません/i })).toBeVisible();
  });
});
