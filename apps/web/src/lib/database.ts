import {
  createPrismaClient,
  type DatabaseClient,
} from "@mosaicgestao/database"

const globalDatabase = globalThis as typeof globalThis & {
  mosaicDatabase?: DatabaseClient
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

export const database =
  globalDatabase.mosaicDatabase ??
  createPrismaClient(requiredEnvironment("DATABASE_URL"))

if (process.env.NODE_ENV !== "production") {
  globalDatabase.mosaicDatabase = database
}
