
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Bell,
  GitMerge,
  Package,
  Rocket,
  Wand2,
  Shield,
  Search,
  Settings,
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
import { ThemeToggle } from "./theme-toggle"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { PageLoader } from "@/components/ui/page-loader"

const sidebarItems = [
  {
    href: "/dashboard/repositories",
    icon: Package,
    label: "Repositories",
    searchPlaceholder: "Search repositories, branches, commits...",
  },
  {
    href: "/dashboard/merge",
    icon: Wand2,
    label: "Conflict Resolution",
    searchPlaceholder: "Search conflicts...",
  },
  {
    href: "/dashboard/releases",
    icon: GitMerge,
    label: "Release History",
    searchPlaceholder: "Search releases...",
  },
  {
    href: "/dashboard/builds",
    icon: Rocket,
    label: "Build Status",
    searchPlaceholder: "Search builds...",
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

function usePageLoading() {
  const { setIsLoading } = useAppStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams, setIsLoading]);

  React.useEffect(() => {
    // This is a bit of a hack to capture link clicks and show the loader.
    // The proper way would be to use Next.js's router events, but that
    // requires a bit more setup. This works for this specific layout.
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      // Check if it's a link and not an external one or a special link
      if (link && link.href && link.target !== '_blank' && !event.ctrlKey && !event.metaKey) {
        const currentUrl = new URL(window.location.href);
        const nextUrl = new URL(link.href);
        if (nextUrl.origin === currentUrl.origin && nextUrl.pathname !== currentUrl.pathname) {
          setIsLoading(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [setIsLoading]);
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = {
    displayName: process.env.NEXT_PUBLIC_USER_DISPLAY_NAME || "DevOps Manager",
    email: process.env.NEXT_PUBLIC_USER_EMAIL || "devops-user",
    photoURL: process.env.NEXT_PUBLIC_USER_PHOTO_URL || "https://i.pravatar.cc/150?u=a042581f4e29026704d"
  };

  const { searchQuery, setSearchQuery, isLoading } = useAppStore();
  const pathname = usePathname();
  const [delayedLoading, setDelayedLoading] = React.useState(isLoading);
  usePageLoading();

  const searchPlaceholder =
    sidebarItems.find((item) => pathname.startsWith(item.href))
      ?.searchPlaceholder || "Search...";


  React.useEffect(() => {
      let timeoutId: NodeJS.Timeout;
      if (isLoading) {
          setDelayedLoading(true);
      } else {
          // Keep loader visible for a short duration to allow fade-out
          timeoutId = setTimeout(() => setDelayedLoading(false), 300);
      }
      return () => clearTimeout(timeoutId);
  }, [isLoading]);


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <Shield />
                <span className="sr-only">DevOps Manager</span>
              </Link>
            </Button>
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              DevOps Manager
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="hidden md:flex" />
          <div className="w-full flex-1 flex justify-center">
             <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={searchPlaceholder}
                  className="pl-9 w-full bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
          </div>
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <div className="relative">
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">3</div>
             </div>
            <Link href="#" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <GithubIcon className="size-5" />
                <span className="sr-only">GitHub</span>
            </Link>
            <Button variant="ghost" size="icon">
                <Settings className="size-5" />
                <span className="sr-only">Settings</span>
            </Button>
            <Link href="#" className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col text-left text-xs">
                  <span className="font-semibold text-foreground">{user.displayName}</span>
                  <span className="text-muted-foreground">@{user.email}</span>
              </div>
            </Link>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 relative">
          {(isLoading || delayedLoading) && <PageLoader show={isLoading} />}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
