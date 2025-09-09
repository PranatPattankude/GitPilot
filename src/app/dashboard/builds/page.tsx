
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader, Clock, GitCommit, GitMerge, GitPullRequest, Tag, MoreHorizontal, RefreshCw, Ban, Calendar, AlertTriangle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format, formatDistanceToNow } from 'date-fns'
import { useAppStore, type Build } from "@/lib/store"
import React from "react"
import { useRouter } from "next/navigation"
import { getAllRecentBuilds, rerunAllJobs, rerunFailedJobs, cancelWorkflowRun } from "../repositories/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BuildLogsDialog } from "./build-logs-dialog"
import { useToast } from "@/hooks/use-toast"

const statusInfo = {
  Success: { icon: CheckCircle2, color: "text-accent" },
  Failed: { icon: XCircle, color: "text-destructive" },
  Cancelled: { icon: Ban, color: "text-muted-foreground" },
  'In Progress': { icon: Loader, color: "text-primary", animation: "animate-spin" },
  Queued: { icon: Clock, color: "text-muted-foreground" },
}

const formatTimestamp = (date: Date) => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    // Defensive check if date is invalid
    if (!date || isNaN(date.getTime())) return 'a few seconds ago';
    if (now.getTime() - date.getTime() < oneDay) {
        return `${formatDistanceToNow(date)} ago`;
    }
    // Use a consistent format to avoid hydration errors
    return format(date, 'MMM d, yyyy');
}

type BuildWithRepo = Build & { repo: string };


function RerunMenuItem({ build, type, onAction }: { build: BuildWithRepo, type: 'all' | 'failed', onAction: () => void }) {
    const [isRerunning, setIsRerunning] = React.useState(false);
    const { toast } = useToast();

    const handleRerun = async () => {
        setIsRerunning(true);
        try {
            const result = type === 'all' 
                ? await rerunAllJobs(build.repo, build.id)
                : await rerunFailedJobs(build.repo, build.id);
            
            if (result.success) {
                toast({ title: "Success", description: `Build rerun for "${type}" jobs has been triggered.` });
                onAction();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error || "Failed to trigger rerun." });
            }
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setIsRerunning(false);
        }
    };

    return (
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleRerun(); }} disabled={isRerunning}>
            {isRerunning ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
            )}
            <span>{isRerunning ? `Rerunning...` : `Rerun ${type} jobs`}</span>
        </DropdownMenuItem>
    );
}

function CancelMenuItem({ build, onAction }: { build: BuildWithRepo, onAction: () => void }) {
    const [isCancelling, setIsCancelling] = React.useState(false);
    const { toast } = useToast();

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            const result = await cancelWorkflowRun(build.repo, build.id);
            
            if (result.success) {
                toast({ title: "Success", description: "Build cancellation has been requested." });
                onAction();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error || "Failed to cancel build." });
            }
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCancel(); }} disabled={isCancelling}>
            {isCancelling ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Ban className="mr-2 h-4 w-4" />
            )}
            <span>{isCancelling ? 'Cancelling...' : 'Cancel build'}</span>
        </DropdownMenuItem>
    );
}

export default function BuildsPage() {
  const { searchQuery, setSearchQuery, addNotifications } = useAppStore();
  const [singleBuilds, setSingleBuilds] = React.useState<BuildWithRepo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewingLogsBuild, setViewingLogsBuild] = React.useState<BuildWithRepo | null>(null);

 const fetchBuilds = React.useCallback(async (isInitialFetch = false) => {
    if (isInitialFetch) {
        setLoading(true);
    }
    setError(null);
    try {
        const buildsData = await getAllRecentBuilds();
        
        if (!isInitialFetch) {
          const previousProblematicBuildIds = new Set(singleBuilds.filter(b => (b.status === 'Failed' || b.status === 'Cancelled')).map(b => b.id));
          const newProblematicBuilds = buildsData.filter(b => 
              (b.status === 'Failed' || b.status === 'Cancelled') && !previousProblematicBuildIds.has(b.id)
          );

          if (newProblematicBuilds.length > 0) {
              const notifications = newProblematicBuilds.map(b => ({
                  type: 'build' as const,
                  message: `Build on branch "${b.branch}" ${b.status.toLowerCase()}.`,
                  repoFullName: b.repo || 'Unknown Repo',
                  url: `/dashboard/builds`,
                  timestamp: b.timestamp,
              }));
              addNotifications(notifications);
          }
        }
        
        setSingleBuilds(buildsData as BuildWithRepo[]);

    } catch (err: any) {
        setError(err.message || "Failed to fetch recent builds.");
    } finally {
        if (isInitialFetch) {
            setLoading(false);
        }
    }
  }, [addNotifications, singleBuilds]);


  // Effect for handling initial load
  React.useEffect(() => {
    setSearchQuery('');
    fetchBuilds(true);
    return () => setSearchQuery('');
  }, []); // Eslint will complain but we want this to run only once on mount
  
  
  // Effect for polling
  React.useEffect(() => {
    const hasInProgressSingleBuilds = singleBuilds.some(b => b.status === 'In Progress' || b.status === 'Queued');
    
    if (hasInProgressSingleBuilds) {
        const interval = setInterval(() => {
            console.log("Refreshing in-progress builds...");
            if (hasInProgressSingleBuilds) fetchBuilds(false);
        }, 15000); // Refresh every 15 seconds
        return () => clearInterval(interval);
    }
  }, [singleBuilds, fetchBuilds]);
  
  const filteredSingleBuilds = singleBuilds.filter(build => 
      !searchQuery ||
      build.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.commit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.triggeredBy?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Build Status</h1>
            <p className="text-muted-foreground mt-1">Live status of your CI/CD pipelines.</p>
        </div>
        <Button variant="outline" onClick={() => fetchBuilds(true)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-8 w-24" />
                    </CardFooter>
                </Card>
            ))
        ) : error ? (
            <div className="col-span-full">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Fetching Builds</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        ) : filteredSingleBuilds.length === 0 ? (
             <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>No recent builds found.</p>
             </div>
        ) : (
        filteredSingleBuilds.map((build) => {
          const SvgIcon = statusInfo[build.status as keyof typeof statusInfo]?.icon
          const color = statusInfo[build.status as keyof typeof statusInfo]?.color
          const animation = statusInfo[build.status as keyof typeof statusInfo]?.animation || ""
          if (!SvgIcon) return null;
          const isFailedOrCancelled = build.status === 'Failed' || build.status === 'Cancelled';
          const isRunning = build.status === 'In Progress' || build.status === 'Queued';


          return (
            <Card key={build.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg truncate">{build.repo || 'Unknown Repo'}</CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SvgIcon className={`size-6 ${color} ${animation}`} />
                     {(isFailedOrCancelled || isRunning) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isFailedOrCancelled && (
                              <>
                                <RerunMenuItem build={build} type="failed" onAction={() => fetchBuilds(true)} />
                                <RerunMenuItem build={build} type="all" onAction={() => fetchBuilds(true)} />
                              </>
                            )}
                            {isRunning && (
                                <CancelMenuItem build={build} onAction={() => fetchBuilds(true)} />
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                     )}
                  </div>
                </div>
                <CardDescription>Branch: <Badge variant="secondary" className="font-medium">{build.branch}</Badge></CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <GitCommit className="size-4 text-muted-foreground" />
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {build.commit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>Duration: {build.duration || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>Triggered {formatTimestamp(build.timestamp)}</span>
                </div>
                 {build.triggeredBy && (
                    <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <span>by {build.triggeredBy}</span>
                    </div>
                 )}
              </CardContent>
              <CardFooter>
                 <Button variant="outline" size="sm" onClick={() => setViewingLogsBuild(build)}>View Logs</Button>
              </CardFooter>
            </Card>
          )
        }))}
      </div>
       {viewingLogsBuild && (
        <BuildLogsDialog
          build={viewingLogsBuild}
          onOpenChange={(open) => !open && setViewingLogsBuild(null)}
        />
      )}
    </>
  )
}
