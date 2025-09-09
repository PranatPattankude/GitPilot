
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Bell,
  GitMerge,
  Package,
  Rocket,
  Wand2,
  Search,
  Settings,
  LogOut,
  AlertTriangle,
  FilePlus2,
  GitPullRequestIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GithubIcon, Shield } from "@/components/icons"
import { ThemeToggle } from "./theme-toggle"
import { Input } from "@/components/ui/input"
import { useAppStore, type AppNotification } from "@/lib/store"
import { PageLoader } from "@/components/ui/page-loader"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

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

function UserMenu({ user }: { user: { name?: string | null, email?: string | null, image?: string | null } }) {
  const displayName = user?.name || "User";
  const displayEmail = user?.email ? user.email.split('@')[0] : "";
  const displayAvatar = user?.image || `https://i.pravatar.cc/150?u=${displayName}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer">
          <Avatar className="size-8">
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback>{displayName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left text-xs">
            <span className="font-semibold text-foreground">{displayName}</span>
            <span className="text-muted-foreground">{displayEmail}</span>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <div className="hidden md:flex flex-col gap-1.5 text-left text-xs">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
        </div>
    </div>
  )
}

const notificationIcons = {
  repo: FilePlus2,
  build: AlertTriangle,
  pr: GitPullRequestIcon,
}

function NotificationBell() {
  const { notifications, clearNotifications } = useAppStore();
  const notificationCount = notifications.length;
  const displayCount = notificationCount > 9 ? "9+" : notificationCount;

  const getIcon = (type: AppNotification['type']) => {
    const Icon = notificationIcons[type];
    const color = type === 'build' ? 'text-destructive' : type === 'pr' ? 'text-green-500' : 'text-blue-500';
    return <Icon className={cn("size-4", color)} />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {displayCount}
              </div>
            )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {notificationCount > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0" onClick={clearNotifications}>Clear all</Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notificationCount > 0 ? (
          <ScrollArea className="h-96">
            {notifications.map(n => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 whitespace-normal">
                <a href={n.url || '#'} target="_blank" rel="noopener noreferrer" className="w-full" onClick={(e) => !n.url && e.preventDefault()}>
                  <div className="flex items-start gap-3">
                    {getIcon(n.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.repoFullName}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">{formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}</p>
                    </div>
                  </div>
                </a>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">You're all caught up!</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession({ required: true });

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
             <NotificationBell />
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <GithubIcon className="size-5" />
                <span className="sr-only">GitHub</span>
            </a>
            {status === "loading" ? <UserMenuSkeleton /> : <UserMenu user={session?.user} />}
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
