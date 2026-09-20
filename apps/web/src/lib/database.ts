import {
  createPrismaClient,
  type DatabaseClient,
} from "@base-app/database"

const globalDatabase = globalThis as typeof globalThis & {
  baseAppDatabase?: DatabaseClient
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

export const database =
  globalDatabase.baseAppDatabase ??
  createPrismaClient(requiredEnvironment("DATABASE_URL"))

if (process.env.NODE_ENV !== "production") {
  globalDatabase.baseAppDatabase = database
}
