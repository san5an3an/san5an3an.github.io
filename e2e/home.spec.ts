import { expect, test } from "@playwright/test";

test("홈 화면 표시", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page.locator("main")).toBeVisible();
});
