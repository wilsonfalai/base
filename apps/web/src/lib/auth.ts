import { createAuth } from "@base-app/auth"

import { database } from "@/lib/database"

function requiredEnvironment(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

const baseURL = requiredEnvironment("BETTER_AUTH_URL")

export const auth = createAuth({
  baseURL,
  database,
  secret: requiredEnvironment("BETTER_AUTH_SECRET"),
  trustedOrigins: [process.env.WEB_ORIGIN ?? baseURL],
})
