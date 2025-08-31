
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
import { ScrollArea } from "@/components/ui/scroll-area"
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
  const { searchQuery, setSearchQuery, bulkBuild, clearBulkBuild } = useAppStore();
  const [singleBuilds, setSingleBuilds] = React.useState<BuildWithRepo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewingLogsBuild, setViewingLogsBuild] = React.useState<BuildWithRepo | null>(null);
  const router = useRouter();

 const fetchBuilds = React.useCallback(async (isInitialFetch = false) => {
    if (isInitialFetch) {
        setLoading(true);
    }
    setError(null);
    try {
        const buildsData = await getAllRecentBuilds();
        const filteredBuilds = (buildsData as BuildWithRepo[]).filter(build => 
            !searchQuery || 
            build.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            build.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
            build.commit.toLowerCase().includes(searchQuery.toLowerCase()) ||
            build.triggeredBy?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSingleBuilds(filteredBuilds);
    } catch (err: any) {
        setError(err.message || "Failed to fetch recent builds.");
    } finally {
        if (isInitialFetch) {
            setLoading(false);
        }
    }
  }, [searchQuery]);

  React.useEffect(() => {
    setSearchQuery('');

    if (!bulkBuild) {
        fetchBuilds(true);
    } else {
        setLoading(false);
    }
    
    return () => setSearchQuery('');
  }, [bulkBuild, fetchBuilds, setSearchQuery]);

  
  React.useEffect(() => {
    // If there's a finished bulk build, clear it after a delay
    // to allow the user to see the result.
    if (bulkBuild && bulkBuild.status !== 'In Progress' && !bulkBuild.repos.some(r => r.status === 'In Progress')) {
      const timer = setTimeout(() => {
        clearBulkBuild();
      }, 30000); // Clear after 30 seconds
      return () => clearTimeout(timer);
    }
  }, [bulkBuild, clearBulkBuild]);
  
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
        {bulkBuild && (
          <Card key={bulkBuild.id} className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitMerge className="size-5" />
                  Bulk Build
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{bulkBuild.repos.length} repositories</span>
                  {(() => {
                    const Info = statusInfo[bulkBuild.status as keyof typeof statusInfo]
                    if (!Info) return null
                    const { icon: Icon, color, animation } = Info
                    return <Icon className={`size-6 ${color} ${animation || ''}`} />
                  })()}
                </div>
              </div>
              <CardDescription className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Merging <Badge variant="secondary">{bulkBuild.sourceBranch}</Badge> into <Badge variant="secondary">{bulkBuild.targetBranch}</Badge></span>
                  <div className="flex items-center gap-1.5">
                      <Calendar className="size-4" />
                      <span>Triggered {formatTimestamp(bulkBuild.timestamp)}</span>
                  </div>
                   {bulkBuild.triggeredBy && (
                    <div className="flex items-center gap-1.5">
                        <User className="size-4" />
                        <span>by {bulkBuild.triggeredBy}</span>
                    </div>
                  )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span>Total duration: {bulkBuild.duration}</span>
              </div>
              <Separator />
              <h4 className="font-medium">Repository Statuses</h4>
              <ScrollArea className="h-48">
                <ul className="space-y-2 pr-4">
                  {bulkBuild.repos.map((repo, index) => {
                    const Info = statusInfo[repo.status as keyof typeof statusInfo]
                    if (!Info) return null;
                    const { icon: Icon, color, animation } = Info
                    const isFailed = repo.status === 'Failed';
                    const isRunning = repo.status === 'In Progress' || repo.status === 'Queued';
                    const repoAsBuildWithRepo = { ...repo, repo: repo.name || '' } as BuildWithRepo;

                    return (
                        <li key={repo.name} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-6 text-right">{index + 1}.</span>
                            <div className="flex flex-col gap-1">
                              <span>{repo.name}</span>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                  <GitCommit className="size-3 text-muted-foreground" />
                                  <span className="font-mono bg-background/50 px-2 py-1 rounded text-xs">
                                    {repo.commit}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="size-3 text-muted-foreground" />
                                  <span className="text-xs">{repo.duration}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="size-3 text-muted-foreground" />
                                  <span className="text-xs">{formatTimestamp(repo.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-2 font-medium ${color}`}>
                              <Icon className={`size-4 ${animation || ''}`} />
                              {repo.status}
                            </span>
                            {(isFailed || isRunning) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">More actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {isFailed && (
                                      <>
                                         <RerunMenuItem build={repoAsBuildWithRepo} type="failed" onAction={() => fetchBuilds(true)} />
                                         <RerunMenuItem build={repoAsBuildWithRepo} type="all" onAction={() => fetchBuilds(true)} />
                                      </>
                                    )}
                                    {isRunning && (
                                      <CancelMenuItem build={repoAsBuildWithRepo} onAction={() => fetchBuilds(true)} />
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                          </div>
                        </li>
                    )
                  })}
                </ul>
              </ScrollArea>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewingLogsBuild(bulkBuild as any)}>View Bulk Log</Button>
               {bulkBuild.status !== "In Progress" && (
                 <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard/repositories")}>Back to Repositories</Button>
               )}
            </CardFooter>
          </Card>
        )}
        {loading && !bulkBuild ? (
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
        ) : filteredSingleBuilds.length === 0 && !bulkBuild ? (
             <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>No recent builds found.</p>
             </div>
        ) : (
        filteredSingleBuilds.map((build) => {
          const SvgIcon = statusInfo[build.status as keyof typeof statusInfo]?.icon
          const color = statusInfo[build.status as keyof typeof statusInfo]?.color
          const animation = statusInfo[build.status as keyof typeof statusInfo]?.animation || ""
          if (!SvgIcon) return null;
          const isFailed = build.status === 'Failed';
          const isRunning = build.status === 'In Progress' || build.status === 'Queued';


          return (
            <Card key={build.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg truncate">{build.repo || 'Unknown Repo'}</CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SvgIcon className={`size-6 ${color} ${animation}`} />
                     {(isFailed || isRunning) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isFailed && (
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
