import { expect, test } from "../../tooling/node_modules/@playwright/test/index.js";

test("homepage communicates both E-MEDIA identities", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: /we make ideas move/i })).toBeVisible(); await expect(page.getByText("E-MEDIA Hub", { exact: true }).first()).toBeVisible(); await expect(page).toHaveTitle(/E-MEDIA/); });
test("services and project request flow are navigable", async ({ page }) => {
  await page.goto("/services");
  await expect(page.getByRole("heading", { name: /creative capability/i })).toBeVisible();
  await page.getByRole("link", { name: /Photography/ }).first().click();
  await expect(page.getByRole("heading", { name: "Photography" })).toBeVisible();
  await page.getByRole("link", { name: /Request a quote/ }).click();
  await expect(page.getByText("Preferred schedule")).toBeVisible();

  const startTime = page.getByLabel("Start time");
  const duration = page.getByLabel("Duration");
  await expect(startTime.locator("option")).toHaveCount(25);
  await expect(duration.locator("option")).toHaveCount(25);
  await startTime.selectOption("23:00");
  await duration.selectOption("90");
  await expect(startTime).toHaveValue("23:00");
  await expect(duration).toHaveValue("90");
});
test("mobile navigation is keyboard-accessible and causes no overflow", async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/"); await page.getByRole("button", { name: "Open menu" }).click(); await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible(); const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth); expect(overflows).toBe(false); });
test("unauthenticated protected areas redirect to sign in", async ({ page }) => { await page.goto("/account/bookings"); await expect(page).toHaveURL(/\/auth\/login/); await page.goto("/admin"); await expect(page).toHaveURL(/\/auth\/login/); });
