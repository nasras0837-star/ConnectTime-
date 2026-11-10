import { test, expect } from "@playwright/test";

const publicPages = [
  "/",
  "/login",
  "/register",
  "/signup",
  "/safety",
  "/community-guidelines",
];

const featurePages = [
  "/profile",
  "/friends",
  "/messages",
  "/dating",
  "/dating/likes",
  "/groups",
  "/marketplace",
  "/news",
  "/free-tv",
  "/videos",
  "/radio",
];

test.describe("Connect public entry points", () => {
  for (const path of publicPages) {
    test(`loads ${path} without a server error`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response, `No document response for ${path}`).not.toBeNull();
      expect(response!.status(), `${path} returned HTTP ${response!.status()}`).toBeLessThan(500);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }

  test("login and registration expose their essential form controls", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    await page.goto("/register");
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.getByRole("link", { name: /log in|sign in/i }).first()).toBeVisible();
  });
});

test.describe("Feature route smoke checks", () => {
  for (const path of featurePages) {
    test(`${path} responds without a server error or missing route`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response, `No document response for ${path}`).not.toBeNull();
      expect(response!.status(), `${path} returned HTTP ${response!.status()}`).toBeLessThan(500);
      expect(response!.status(), `${path} is missing`).not.toBe(404);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});

test.describe("Authenticated member journeys", () => {
  test("signs in and opens member features", async ({ page }) => {
    const email = process.env.CONNECT_QA_EMAIL;
    const password = process.env.CONNECT_QA_PASSWORD;
    test.skip(!email || !password, "Set CONNECT_QA_EMAIL and CONNECT_QA_PASSWORD to enable authenticated staging tests.");

    await page.goto("/login");
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.locator('form button[type="submit"]').click();

    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });

    for (const path of featurePages) {
      const response = await page.goto(path);
      expect(response, `No document response for authenticated route ${path}`).not.toBeNull();
      expect(response!.status(), `${path} returned HTTP ${response!.status()}`).toBeLessThan(500);
      expect(response!.status(), `${path} is missing`).not.toBe(404);
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});
