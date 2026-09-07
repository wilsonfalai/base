import type { InternalUser } from "@mosaicgestao/auth/permissions"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { UsersManagement } from "@/components/users-management"
import { auth } from "@/lib/auth"

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user as InternalUser | undefined

  if (!session) {
    redirect("/login")
  }

  if (user?.role !== "admin") {
    redirect("/dashboard")
  }

  return <UsersManagement currentUserId={user.id} />
}
