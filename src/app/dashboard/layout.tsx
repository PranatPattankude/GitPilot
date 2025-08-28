
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  GitMerge,
  Package,
  Rocket,
  Users,
  Wand2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GithubIcon } from "@/components/icons"

const sidebarItems = [
  {
    href: "/dashboard/repositories",
    icon: Package,
    label: "Repositories",
  },
  {
    href: "/dashboard/merge",
    icon: Wand2,
    label: "Conflict Resolution",
  },
  {
    href: "/dashboard/releases",
    icon: GitMerge,
    label: "Release History",
  },
  {
    href: "/dashboard/builds",
    icon: Rocket,
    label: "Build Status",
  },
]

function SidebarNav() {
  const pathname = usePathname()
  return (
    <SidebarMenu>
      {sidebarItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href)}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = {
    displayName: "Guest User",
    email: "guest@example.com",
    photoURL: ""
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <GitMerge />
                <span className="sr-only">GitPilot</span>
              </Link>
            </Button>
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              GitPilot
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:flex" />
          <div className="w-full flex-1">
             {/* Future top nav search can go here */}
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">3</div>
             </div>
            <Link href="#" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <GithubIcon className="size-5" />
                <span className="hidden md:inline">GitHub</span>
            </Link>
            <Avatar className="size-8">
              <AvatarImage src={user?.photoURL} alt={user?.displayName} />
              <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
