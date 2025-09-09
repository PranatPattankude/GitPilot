
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
import { CheckCircle2, XCircle, Loader, Clock, GitCommit, GitMerge, GitPullRequest, MoreHorizontal, RefreshCw, Ban, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { format, formatDistanceToNow } from 'date-fns'
import { useAppStore, type Build, type BulkBuild } from "@/lib/store"
import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getAllRecentBuilds, rerunAllJobs, rerunFailedJobs, cancelWorkflowRun, getPullRequest } from "../../repositories/actions"
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
    if (!date || isNaN(date.getTime())) return 'a few seconds ago';
    if (now.getTime() - date.getTime() < oneDay) {
        return `${formatDistanceToNow(date)} ago`;
    }
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

export default function BulkBuildPage({ params }: { params: { bulkId: string }}) {
  const { bulkBuild, setBulkBuild } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

 const fetchBulkBuildStatus = React.useCallback(async (currentBuild: BulkBuild) => {
      const prIdentifiers = currentBuild.repos.map(r => ({ repoFullName: r.repo!, prNumber: r.prNumber! }));
      
      const prPromises = prIdentifiers.map(p => getPullRequest(p.repoFullName, p.prNumber));
      const allBuildPromises = currentBuild.repos.map(r => getAllRecentBuilds().then(builds => builds.find(b => b.prNumber === r.prNumber)));

      try {
          const [prResults, buildResults] = await Promise.all([Promise.all(prPromises), Promise.all(allBuildPromises)]);

          const updatedRepos = currentBuild.repos.map(repo => {
              const livePr = prResults.find(pr => pr?.number === repo.prNumber);
              const liveBuild = buildResults.find(b => b?.prNumber === repo.prNumber);
              
              if (liveBuild) {
                  return { ...repo, ...liveBuild, repo: repo.repo! };
              }
              if (livePr) {
                   let status: Build['status'] = 'Queued';
                   if (livePr.merged) status = 'Success';
                   else if (livePr.state === 'closed' && !livePr.merged) status = 'Cancelled';
                   else if (livePr.mergeable_state === 'dirty') status = 'Failed';
                   else if (livePr.mergeable_state !== 'unknown') status = 'In Progress';
                  
                   return { ...repo, status, commit: livePr.head.sha.substring(0,7), repo: repo.repo! };
              }
              return repo;
          });
          
          const allFinished = updatedRepos.every(r => r.status === 'Success' || r.status === 'Failed' || r.status === 'Cancelled');

          setBulkBuild({ 
            ...currentBuild, 
            repos: updatedRepos,
            status: allFinished ? 'Success' : 'In Progress'
          });

      } catch (e: any) {
          console.error("Error fetching bulk build status", e);
          toast({ variant: 'destructive', title: 'Error', description: `Could not refresh build status: ${e.message}`});
      }
  }, [setBulkBuild, toast]);


  // Effect for handling initial load and rehydration from URL
  React.useEffect(() => {
    const bulkId = params.bulkId;
    if (bulkId && !bulkBuild) {
        const newBulkBuild: BulkBuild = {
            id: bulkId,
            sourceBranch: searchParams.get('source') || '',
            targetBranch: searchParams.get('target') || '',
            user: searchParams.get('user') || '',
            status: 'In Progress',
            timestamp: new Date(parseInt(bulkId, 10)),
            duration: '0s',
            repos: (searchParams.get('prs')?.split(',') || []).map(prString => {
                const [repoFullName, prNumber] = prString.split(':');
                return {
                    id: prNumber,
                    prNumber: parseInt(prNumber, 10),
                    repo: repoFullName,
                    name: repoFullName,
                    status: 'Queued',
                    timestamp: new Date(),
                    branch: searchParams.get('source') || '',
                    commit: '...'.padStart(7,'.')
                };
            })
        };
        setBulkBuild(newBulkBuild);
    }
  }, [params.bulkId, searchParams, bulkBuild, setBulkBuild]);
  
  
  // Effect for polling
  React.useEffect(() => {
    const isBulkBuildInProgress = bulkBuild && bulkBuild.status === 'In Progress';

    if (isBulkBuildInProgress) {
        const interval = setInterval(() => {
            console.log("Refreshing in-progress bulk build...");
            fetchBulkBuildStatus(bulkBuild);
        }, 15000); // Refresh every 15 seconds
        return () => clearInterval(interval);
    }
  }, [bulkBuild, fetchBulkBuildStatus]);
  
  return (
    <>
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bulk Build Status</h1>
                <p className="text-muted-foreground mt-1">Live status of your bulk merge operation.</p>
            </div>
             {bulkBuild && (
                 <Button variant="outline" onClick={() => fetchBulkBuildStatus(bulkBuild)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
             )}
        </header>

        {bulkBuild ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitMerge className="size-5" />
                  Bulk Merge Operation
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
                   {bulkBuild.user && (
                    <div className="flex items-center gap-1.5">
                        <User className="size-4" />
                        <span>by {bulkBuild.user}</span>
                    </div>
                  )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Separator />
              <h4 className="font-medium">Repository Statuses</h4>
              <ScrollArea className="h-72">
                <ul className="space-y-2 pr-4">
                  {bulkBuild.repos.map((repo, index) => {
                    const Info = statusInfo[repo.status as keyof typeof statusInfo]
                    if (!Info) return null;
                    const { icon: Icon, color, animation } = Info
                    const isFailedOrCancelled = repo.status === 'Failed' || repo.status === 'Cancelled';
                    const isRunning = repo.status === 'In Progress' || repo.status === 'Queued';
                    const repoAsBuildWithRepo = { ...repo, repo: repo.name || '' } as BuildWithRepo;

                    return (
                        <li key={repo.name} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-6 text-right">{index + 1}.</span>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{repo.name}</span>
                               <div className="flex items-center gap-4 text-muted-foreground">
                                {repo.prUrl && (
                                  <a href={repo.prUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline text-primary">
                                    <GitPullRequest className="size-3" />
                                    <span className="text-xs">PR #{repo.prNumber}</span>
                                  </a>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <GitCommit className="size-3" />
                                  <span className="font-mono bg-background/50 px-1 rounded text-xs">
                                    {repo.commit}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="size-3" />
                                  <span className="text-xs">{repo.duration || '...'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-2 font-medium ${color}`}>
                              <Icon className={`size-4 ${animation || ''}`} />
                              {repo.status}
                            </span>
                            {(isFailedOrCancelled || isRunning) && repo.id && (
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
                                         <RerunMenuItem build={repoAsBuildWithRepo} type="failed" onAction={() => {}} />
                                         <RerunMenuItem build={repoAsBuildWithRepo} type="all" onAction={() => {}} />
                                      </>
                                    )}
                                    {isRunning && (
                                      <CancelMenuItem build={repoAsBuildWithRepo} onAction={() => {}} />
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
               <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/repositories')}>Back to Repositories</Button>
               {bulkBuild.status !== "In Progress" && (
                 <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard/builds')}>View All Builds</Button>
               )}
            </CardFooter>
          </Card>
        ) : (
            <div className="text-center py-12 text-muted-foreground">
                <p>No active bulk build found. You may have been redirected here by mistake.</p>
                <Button variant="link" onClick={() => router.push('/dashboard/repositories')}>Go to repositories to start one.</Button>
            </div>
        )}
    </>
  )
}
