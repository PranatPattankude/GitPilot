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
import { GitCommit, Package, TestTube, CheckCircle2, Loader, XCircle, AlertTriangle, MoreHorizontal, RefreshCw } from "lucide-react"
import type { Repository } from "@/lib/store"
import { Button } from "@/components/ui/button"

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
  { id: "build-1", branch: "main", commit: "a1b2c3d", status: "In Progress", currentStep: 2, totalSteps: 4, error: null },
  { id: "build-2", branch: "feature/new-ui", commit: "b4e5f6g", status: "In Progress", currentStep: 1, totalSteps: 4, error: null },
  { id: "build-3", branch: "hotfix/login-bug", commit: "h7i8j9k", status: "Success", currentStep: 4, totalSteps: 4, error: null },
  { id: "build-4", branch: "develop", commit: "l0m1n2o", status: "Failed", currentStep: 3, totalSteps: 4, error: "Unit tests failed: 12/15 passed." },
  { id: "build-5", branch: "main", commit: "p3q4r5s", status: "Failed", currentStep: 2, totalSteps: 4, error: "Build command exited with code 1" },
  { id: "build-6", branch: "feature/analytics", commit: "t6u7v8w", status: "Success", currentStep: 4, totalSteps: 4, error: null },
  { id: "build-7", branch: "develop", commit: "x9y0z1a", status: "In Progress", currentStep: 3, totalSteps: 4, error: null },
]

const statusInfo = {
  "In Progress": { icon: Loader, color: "text-primary", animation: "animate-spin" },
  "Success": { icon: CheckCircle2, color: "text-accent" },
  "Failed": { icon: XCircle, color: "text-destructive" },
}

export function BuildStatusDialog({ repo, onOpenChange }: BuildStatusDialogProps) {
  const buildsForRepo = mockBuilds.filter(build => build.status === "In Progress" || build.status === "Failed");

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

            return (
              <Card key={build.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium">
                    <span className="font-mono bg-muted px-2 py-1 rounded">{build.commit}</span> on <span className="text-primary">{build.branch}</span>
                  </CardTitle>
                   <div className="flex items-center gap-2">
                    <SvgIcon className={`size-5 ${color} ${animation}`} />
                    <Badge variant={isFailed ? "destructive" : build.status === "Success" ? "default" : "secondary"} className={build.status === "Success" ? "bg-accent" : ""}>{build.status}</Badge>
                    {isFailed && (
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>Rerun failed jobs</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>Rerun all jobs</span>
                            </DropdownMenuItem>
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
                        const isCompleted = index < build.currentStep;
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
