import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { accessControl, authRoles } from "@mosaicgestao/auth/permissions"

export const authClient = createAuthClient({
  plugins: [adminClient({ ac: accessControl, roles: authRoles })],
})
