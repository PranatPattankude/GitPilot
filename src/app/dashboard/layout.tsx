"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  GitMerge,
  Github,
  History,
  Home,
  LogOut,
  Package,
  Rocket,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GitPilotLogo } from "@/components/icons"

const menuItems = [
  {
    href: "/dashboard/repositories",
    icon: Package,
    label: "Repositories",
  },
  {
    href: "/dashboard/merge",
    icon: GitMerge,
    label: "Merge & Conflict Resolution",
  },
  {
    href: "/dashboard/releases",
    icon: History,
    label: "Release History",
  },
  {
    href: "/dashboard/builds",
    icon: Rocket,
    label: "Build Status",
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  
  const user = {
    displayName: "Guest User",
    email: "guest@example.com",
    photoURL: ""
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <GitPilotLogo className="size-6" />
            <span className="text-lg font-semibold">GitPilot</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  onClick={() => router.push(item.href)}
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-sidebar-accent">
            <Avatar className="size-8">
              <AvatarImage src={user?.photoURL} alt={user?.displayName} />
              <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm overflow-hidden">
              <span className="font-semibold truncate">{user?.displayName}</span>
              <span className="text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
