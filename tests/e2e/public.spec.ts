import { expect, test } from "../../tooling/node_modules/@playwright/test/index.js";

test("homepage communicates both E-MEDIA identities", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: /fast content delivery/i })).toBeVisible(); await expect(page.getByText("E-MEDIA Hub", { exact: true }).first()).toBeVisible(); await expect(page).toHaveTitle(/E-MEDIA/); });
test("services and project request flow are navigable", async ({ page }) => {
  await page.goto("/services");
  await expect(page.getByRole("heading", { name: /creative capability/i })).toBeVisible();
  await page.getByRole("link", { name: /Photography/ }).first().click();
  await expect(page.getByRole("heading", { name: "Photography" })).toBeVisible();
  await page.getByRole("link", { name: /Request a quote/ }).click();
  await expect(page).toHaveURL(/\/auth\/signup/);
  await expect(page.getByRole("heading", { name: "Create your client account." })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", {exact:true})).toBeVisible();
  await expect(page.getByRole("button", {name:/Create my account/})).toBeVisible();
});
test("mobile navigation is keyboard-accessible and causes no overflow", async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/"); await page.getByRole("button", { name: "Open menu" }).click(); await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible(); const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth); expect(overflows).toBe(false); });
test("unauthenticated protected areas redirect to sign in", async ({ page }) => { await page.goto("/account/bookings"); await expect(page).toHaveURL(/\/auth\/login/); await page.goto("/admin"); await expect(page).toHaveURL(/\/auth\/login/); });
