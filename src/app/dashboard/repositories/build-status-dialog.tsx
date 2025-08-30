
"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { GitCommit, Package, TestTube, CheckCircle2, Loader, XCircle, AlertTriangle, MoreHorizontal, RefreshCw, Ban, Calendar } from "lucide-react"
import type { Repository, Build } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'
import { getBuildsForRepo, rerunAllJobs, rerunFailedJobs } from "./actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface BuildStatusDialogProps {
  repo: Repository
  onOpenChange: (open: boolean) => void
}

const steps = [
  { name: "Setup", icon: Package },
  { name: "Build", icon: GitCommit },
  { name: "Test", icon: TestTube },
  { name: "Deploy", icon: CheckCircle2 },
]

const statusInfo = {
  "In Progress": { icon: Loader, color: "text-primary", animation: "animate-spin" },
  "Success": { icon: CheckCircle2, color: "text-accent" },
  "Failed": { icon: XCircle, color: "text-destructive" },
}

const formatTimestamp = (date: Date) => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now.getTime() - date.getTime() < oneDay) {
        return `${formatDistanceToNow(date)} ago`;
    }
    return date.toLocaleString();
}

function RerunMenuItem({ build, type, onRerun }: { build: Build, type: 'all' | 'failed', onRerun: (type: 'all' | 'failed') => void }) {
    const [isRerunning, setIsRerunning] = React.useState(false);
    const { toast } = useToast();

    const handleRerun = async () => {
        if (!build.repo) return;
        setIsRerunning(true);
        try {
            const result = type === 'all' 
                ? await rerunAllJobs(build.repo, build.id)
                : await rerunFailedJobs(build.repo, build.id);
            
            if (result.success) {
                toast({ title: "Success", description: `Build rerun for "${type}" jobs has been triggered.` });
                onRerun(type);
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

export function BuildStatusDialog({ repo, onOpenChange }: BuildStatusDialogProps) {
  const [builds, setBuilds] = React.useState<Build[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchBuilds = React.useCallback(() => {
     if (repo.fullName) {
      setLoading(true);
      getBuildsForRepo(repo.fullName)
        .then((buildData) => {
            const buildsWithRepo = buildData.map(b => ({ ...b, repo: repo.fullName }))
            setBuilds(buildsWithRepo)
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [repo.fullName]);

  React.useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Build Status for {repo.name}</DialogTitle>
          <DialogDescription>
            Live status of active and recent builds for this repository.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          ) : error ? (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : builds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
                <p>No recent builds found for this repository.</p>
            </div>
          ) : (
            builds.map((build) => {
              const SvgIcon = statusInfo[build.status as keyof typeof statusInfo].icon;
              const color = statusInfo[build.status as keyof typeof statusInfo].color;
              const animation = statusInfo[build.status as keyof typeof statusInfo].animation || '';
              
              const isFailed = build.status === "Failed";
              const isSuccess = build.status === "Success";
              const isInProgress = build.status === "In Progress";

              // Mocking progress for now as GitHub API doesn't provide steps
              const progressValue = isSuccess ? 100 : isInProgress ? 50 : isFailed ? 75 : 0;
              const currentStep = isSuccess ? 4 : isInProgress ? 2 : isFailed ? 3 : 1;


              return (
                <Card key={build.id}>
                  <CardHeader className="flex-row items-start justify-between pb-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <CardTitle className="text-base font-medium">
                        <span className="font-mono bg-muted px-2 py-1 rounded">{build.commit}</span> on <span className="text-primary">{build.branch}</span>
                      </CardTitle>
                       <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="size-3.5" />
                          <span>Triggered {formatTimestamp(build.timestamp)}</span>
                      </div>
                    </div>
                     <div className="flex items-center gap-2">
                      <SvgIcon className={`size-5 ${color} ${animation}`} />
                      <Badge variant={isFailed ? "destructive" : isSuccess ? "default" : "secondary"} className={isSuccess ? "bg-accent" : ""}>{build.status}</Badge>
                      {(isFailed || isInProgress) && (
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
                                  <RerunMenuItem build={build} type="failed" onRerun={fetchBuilds} />
                                  <RerunMenuItem build={build} type="all" onRerun={fetchBuilds} />
                                </>
                              )}
                              {isInProgress && (
                                 <DropdownMenuItem>
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>Cancel build</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                      )}
                     </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={progressValue} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        {steps.map((step, index) => {
                          const isCompleted = index < currentStep || isSuccess;
                          const isCurrent = index + 1 === currentStep && build.status === "In Progress";
                          
                          return (
                            <div key={step.name} className="flex flex-col items-center text-center">
                              <div className={`flex items-center justify-center size-8 rounded-full border-2 ${isCompleted || isCurrent ? 'border-primary' : 'border-border'} ${isCompleted ? 'bg-primary text-primary-foreground' : ''}`}>
                                {isCompleted ? <CheckCircle2 className="size-4" /> : <step.icon className={`size-4 ${isCurrent ? 'animate-pulse' : ''}`} />}
                              </div>
                              <span className={`mt-1 font-medium ${isCurrent ? 'text-primary' : ''}`}>{step.name}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {isFailed && build.error && (
                      <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="size-4 mt-0.5" />
                          <div>
                            <p className="font-semibold">Failure Reason:</p>
                            <p>{build.error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
