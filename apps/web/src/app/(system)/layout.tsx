import type { CSSProperties, ReactNode } from "react"
import type { InternalUser } from "@mosaicgestao/auth/permissions"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"

export default async function SystemLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  const user = session.user as InternalUser

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar
        user={{
          avatar: user.image ?? "",
          email: user.email,
          name: user.name,
          role: user.role,
        }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
