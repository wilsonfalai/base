import { createPrismaClient } from "@base-app/database";
import { e2eUsers } from "../global-setup.js";
import { expect, test } from "../fixtures/test.js";

const webBaseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("user administration", () => {
  test.describe.configure({ timeout: 240_000 });

  test("keeps administrative actions inaccessible to collaborators", async ({
    page,
  }) => {
    const user = e2eUsers.collaborator;
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Senha").fill(user.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });

    await expect(page.getByRole("link", { name: "Usuários" })).toHaveCount(0);
    await page.goto("/users");
    await expect(page).toHaveURL(/\/dashboard$/);

    const response = await page
      .context()
      .request.get(`${webBaseUrl}/api/auth/admin/list-users`);
    expect(response.status()).toBe(403);
  });

  test("allows an administrator to create and manage user access", async ({
    browser,
    page,
  }) => {
    const admin = e2eUsers.admin;
    const managed = e2eUsers.managed;

    await page.goto("/login");
    await page.getByLabel("Email").fill(admin.email);
    await page.getByLabel("Senha").fill(admin.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });

    await expect(page.getByRole("link", { name: "Usuários" })).toBeVisible();
    await page.goto("/users", { timeout: 90_000 });
    await expect(page).toHaveURL(/\/users$/);
    await expect(
      page.getByRole("heading", { name: "Usuários", level: 2 }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Novo usuário" }).click();
    await expect(
      page.getByRole("heading", { name: "Novo usuário" }),
    ).toBeVisible();
    await page.getByLabel("Nome").fill(managed.name);
    await page
      .getByRole("textbox", { name: "E-mail", exact: true })
      .fill(managed.email);
    await page.getByLabel("Senha temporária").fill(managed.password);
    const createResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/auth/admin/create-user"),
    );
    await page.getByRole("button", { name: "Criar usuário" }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(200);

    let managedRow = page.getByRole("row", { name: new RegExp(managed.email) });
    await expect(managedRow).toBeVisible();

    await managedRow.getByRole("button", { name: /^Ações de/ }).click();
    await page.getByRole("menuitem", { name: "Visualizar" }).click();
    await expect(
      page.getByRole("heading", { name: "Detalhes do usuário" }),
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText(managed.email, { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Fechar" }).click();

    await managedRow.getByRole("button", { name: /^Ações de/ }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();
    await expect(
      page.getByRole("heading", { name: "Editar usuário" }),
    ).toBeVisible();
    const updatedName = `${managed.name} Atualizado`;
    await page.getByLabel("Nome").fill(updatedName);
    await page.getByLabel("Perfil").click();
    await page.getByRole("option", { name: "Administrador" }).click();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    managedRow = page.getByRole("row", { name: new RegExp(managed.email) });
    await expect(managedRow.getByText(updatedName, { exact: true })).toBeVisible();
    await expect(
      managedRow.getByText("Administrador", { exact: true }),
    ).toBeVisible();

    await managedRow.getByRole("button", { name: /^Ações de/ }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();
    await page.getByLabel("Perfil").click();
    await page.getByRole("option", { name: "Colaborador" }).click();
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    const managedContext = await browser.newContext({ baseURL: webBaseUrl });
    const managedPage = await managedContext.newPage();
    await managedPage.goto("/login");
    await managedPage.getByLabel("Email").fill(managed.email);
    await managedPage.getByLabel("Senha").fill(managed.password);
    await managedPage.getByRole("button", { name: "Login", exact: true }).click();
    await expect(managedPage).toHaveURL(/\/dashboard$/);

    managedRow = page.getByRole("row", { name: new RegExp(managed.email) });
    await managedRow.getByRole("button", { name: /^Ações de/ }).click();
    await page.getByRole("menuitem", { name: "Inativar" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    managedRow = page.getByRole("row", { name: new RegExp(managed.email) });
    await expect(managedRow.getByText("Inativo", { exact: true })).toBeVisible();

    await managedPage.goto("/dashboard");
    await expect(managedPage).toHaveURL(/\/login$/);

    managedRow = page.getByRole("row", { name: new RegExp(managed.email) });
    await managedRow.getByRole("button", { name: /^Ações de/ }).click();
    await page.getByRole("menuitem", { name: "Ativar" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    managedRow = page.getByRole("row", { name: new RegExp(managed.email) });
    await expect(managedRow.getByText("Ativo", { exact: true })).toBeVisible();

    await managedPage.getByLabel("Email").fill(managed.email);
    await managedPage.getByLabel("Senha").fill(managed.password);
    await managedPage.getByRole("button", { name: "Login", exact: true }).click();
    await expect(managedPage).toHaveURL(/\/dashboard$/);
    await managedContext.close();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for the E2E audit assertion");
    }

    const database = createPrismaClient(databaseUrl);
    try {
      const actor = await database.user.findUniqueOrThrow({
        select: { id: true },
        where: { email: admin.email },
      });
      const target = await database.user.findUniqueOrThrow({
        select: { id: true },
        where: { email: managed.email },
      });
      const auditEntries = await database.auditLog.findMany({
        select: { action: true },
        where: {
          actorUserId: actor.id,
          entityId: target.id,
          entityType: "user",
        },
      });

      expect(auditEntries.map((entry) => entry.action)).toEqual(
        expect.arrayContaining(["user.created", "user.updated"]),
      );
    } finally {
      await database.$disconnect();
    }
  });
});
