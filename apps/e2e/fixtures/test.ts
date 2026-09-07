import { randomUUID } from "node:crypto";

import {
  expect,
  test as base,
  type APIRequestContext,
} from "@playwright/test";

type Cleanup = () => Promise<void>;
type RegisterCleanup = (cleanup: Cleanup) => void;

type E2EFixtures = {
  api: APIRequestContext;
  registerCleanup: RegisterCleanup;
  runId: string;
};

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://localhost:3001";

export const test = base.extend<E2EFixtures>({
  api: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({ baseURL: apiBaseUrl });

    await use(api);
    await api.dispose();
  },
  registerCleanup: async ({}, use) => {
    const cleanups: Cleanup[] = [];

    await use((cleanup) => cleanups.push(cleanup));

    const results = await Promise.allSettled(
      cleanups.reverse().map((cleanup) => cleanup()),
    );
    const failures = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);

    if (failures.length > 0) {
      throw new AggregateError(failures, "E2E data cleanup failed");
    }
  },
  runId: async ({}, use, testInfo) => {
    const testSlug = testInfo.titlePath
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);

    await use(`${testSlug}-${testInfo.parallelIndex}-${randomUUID()}`);
  },
});

export function createAuthenticatedTest(
  storageStatePath = process.env.E2E_AUTH_STATE_PATH,
) {
  if (!storageStatePath) {
    throw new Error(
      "E2E_AUTH_STATE_PATH is required for authenticated browser tests",
    );
  }

  return test.extend({ storageState: storageStatePath });
}

export { expect };
