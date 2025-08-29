
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Terminal } from "lucide-react"
import { type Build } from "@/lib/store"
import { getBuildLogs } from "../repositories/actions"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BuildLogsDialogProps {
  build: Build & { repo: string }
  onOpenChange: (open: boolean) => void
}

export function BuildLogsDialog({ build, onOpenChange }: BuildLogsDialogProps) {
  const [logs, setLogs] = React.useState<{ [jobName: string]: string } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (build.repo && build.id) {
      setLoading(true)
      getBuildLogs(build.repo, build.id)
        .then(setLogs)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [build.repo, build.id])

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Logs for <span className="font-mono bg-muted px-2 py-1 rounded">{build.commit}</span>
          </DialogTitle>
          <DialogDescription>
            Repository: {build.repo} | Branch: {build.branch}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="p-4 border rounded-md">
                 <Skeleton className="h-64 w-full" />
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Fetching Logs</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : logs && Object.keys(logs).length > 0 ? (
            <Accordion type="single" collapsible defaultValue={Object.keys(logs)[0]} className="w-full">
              {Object.entries(logs).map(([jobName, logContent]) => (
                <AccordionItem value={jobName} key={jobName}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <Terminal className="size-4" />
                        <span>{jobName}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-96 w-full rounded-md border bg-muted/50">
                        <pre className="p-4 text-xs font-mono">
                            <code>{logContent}</code>
                        </pre>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
                <p>No logs found for this build.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
