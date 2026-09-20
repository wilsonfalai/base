import { e2eUsers } from "../global-setup.js";
import { expect, test } from "../fixtures/test.js";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://localhost:3001";

test.describe("authentication", () => {
  test("shows a generic error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("unknown@base-app.local");
    await page.getByLabel("Senha").fill("invalid-password");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(
      page.getByText(
        "Não foi possível entrar. Verifique seu e-mail e sua senha.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logs in, shares the session with the API and logs out", async ({
    page,
  }) => {
    const e2eUser = e2eUsers.collaborator;
    await page.goto("/login");
    await page.getByLabel("Email").fill(e2eUser.email);
    await page.getByLabel("Senha").fill(e2eUser.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
    await expect(page.getByText(e2eUser.email, { exact: true })).toBeVisible();

    const sessionResponse = await page
      .context()
      .request.get(`${apiBaseUrl}/auth/session`);
    expect(sessionResponse.status()).toBe(200);
    await expect(sessionResponse.json()).resolves.toMatchObject({
      user: { email: e2eUser.email, name: e2eUser.name },
    });

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByText(e2eUser.email, { exact: true }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login$/);
    const signedOutResponse = await page
      .context()
      .request.get(`${apiBaseUrl}/auth/session`);
    expect(signedOutResponse.status()).toBe(401);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });
});
