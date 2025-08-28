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
  Search,
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GitPilotLogo } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1">
               {/* Can add breadcrumbs or page title here */}
            </div>
            <div className="w-full flex-1">
              <form>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                  />
                </div>
              </form>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="size-8">
                    <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                    <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
