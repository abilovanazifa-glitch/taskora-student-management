import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page renders form fields", async ({ page }) => {
    await page.goto("/ja/login");
    await expect(page.getByLabel(/メール|Email/i)).toBeVisible();
    await expect(page.getByLabel(/パスワード|Parol/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /ログイン|Kirish/i })).toBeVisible();
  });

  test("register page renders form fields", async ({ page }) => {
    await page.goto("/uz/register");
    await expect(page.getByLabel(/Email|email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Hisob yaratish|登録/i })).toBeVisible();
  });

  test("protected dashboard redirects to login", async ({ page }) => {
    await page.goto("/ja/dashboard");
    await expect(page).toHaveURL(/\/ja\/login/);
  });
});
