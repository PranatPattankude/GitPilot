"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  GitMerge,
  Menu,
  Package,
  Rocket,
  Users,
  Wand2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname()
  return (
    <nav className={cn("grid items-start gap-2 px-2 text-sm font-medium lg:px-4", className)}>
      {sidebarItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            {
              "bg-muted text-primary": pathname.startsWith(item.href),
            }
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
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
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <GitMerge className="h-6 w-6" />
              <span className="">GitPilot</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1">
            <SidebarNav />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <GitMerge className="h-6 w-6" />
                  <span className="">GitPilot</span>
                </Link>
              </div>
              <SidebarNav className="mt-5" />
            </SheetContent>
          </Sheet>
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
      </div>
    </div>
  )
}
