"use client"

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
import type { Repository } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'

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

const mockBuilds = [
  { id: "build-1", branch: "main", commit: "a1b2c3d", status: "In Progress", currentStep: 2, totalSteps: 4, error: null, timestamp: new Date(Date.now() - 2 * 60 * 1000) },
  { id: "build-2", branch: "feature/new-ui", commit: "b4e5f6g", status: "In Progress", currentStep: 1, totalSteps: 4, error: null, timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { id: "build-3", branch: "hotfix/login-bug", commit: "h7i8j9k", status: "Success", currentStep: 4, totalSteps: 4, error: null, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
  { id: "build-4", branch: "develop", commit: "l0m1n2o", status: "Failed", currentStep: 3, totalSteps: 4, error: "Unit tests failed: 12/15 passed.", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "build-5", branch: "main", commit: "p3q4r5s", status: "Failed", currentStep: 2, totalSteps: 4, error: "Build command exited with code 1", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: "build-6", branch: "feature/analytics", commit: "t6u7v8w", status: "Success", currentStep: 4, totalSteps: 4, error: null, timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000) },
  { id: "build-7", branch: "develop", commit: "x9y0z1a", status: "In Progress", currentStep: 3, totalSteps: 4, error: null, timestamp: new Date(Date.now() - 15 * 60 * 1000) },
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

export function BuildStatusDialog({ repo, onOpenChange }: BuildStatusDialogProps) {
  const buildsForRepo = mockBuilds;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Build Status for {repo.name}</DialogTitle>
          <DialogDescription>
            Live status of active and recent failed builds for this repository.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {buildsForRepo.map((build) => {
            const SvgIcon = statusInfo[build.status as keyof typeof statusInfo].icon;
            const color = statusInfo[build.status as keyof typeof statusInfo].color;
            const animation = statusInfo[build.status as keyof typeof statusInfo].animation || '';
            const progressValue = (build.currentStep / build.totalSteps) * 100;
            const isFailed = build.status === "Failed";
            const isSuccess = build.status === "Success";
            const isInProgress = build.status === "In Progress";

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
                                <DropdownMenuItem>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  <span>Rerun failed jobs</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  <span>Rerun all jobs</span>
                                </DropdownMenuItem>
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
                        const isCompleted = index < build.currentStep || isSuccess;
                        const isCurrent = index + 1 === build.currentStep && build.status === "In Progress";
                        
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
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

    