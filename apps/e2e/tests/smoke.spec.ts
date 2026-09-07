import { expect, test } from "../fixtures/test.js";

test.describe("critical pages", () => {
  test("shows the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByText("Acesse sua conta", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Login", exact: true }),
    ).toBeVisible();
  });

  test("redirects anonymous users away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Acesse sua conta", { exact: true })).toBeVisible();
  });
});
