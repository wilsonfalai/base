import { expect, test } from "../fixtures/test.js";

test.describe("critical pages", () => {
  test("shows the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByText("Login to your account", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Login", exact: true }),
    ).toBeVisible();
  });

  test("shows the dashboard inside the system layout", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Total Revenue", { exact: true })).toBeVisible();
  });
});
