
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Terminal, ChevronRight } from "lucide-react"
import { type Build } from "@/lib/store"
import { getBuildLogs } from "../repositories/actions"
import { ScrollArea } from "@/components/ui/scroll-area"

// Log Parsing Logic
type LogLine = { type: 'line'; content: string };
type LogStep = { type: 'step'; title: string; children: (LogLine | LogStep)[] };
type ParsedLog = (LogLine | LogStep)[];

function parseGitHubLogs(logContent: string): ParsedLog {
  const lines = logContent.split('\n');
  const result: ParsedLog = [];
  const stack: LogStep[] = [];

  lines.forEach(line => {
    const groupStartMatch = line.match(/##\[group](.*)/);
    if (groupStartMatch) {
      const newStep: LogStep = { type: 'step', title: groupStartMatch[1].trim(), children: [] };
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(newStep);
      } else {
        result.push(newStep);
      }
      stack.push(newStep);
      return;
    }

    const groupEndMatch = line.match(/##\[endgroup]/);
    if (groupEndMatch) {
      stack.pop();
      return;
    }
    
    // We don't want to show metadata lines in the output
    if (line.startsWith('##[')) return;

    const parent = stack.length > 0 ? stack[stack.length - 1] : null;
    const logLine: LogLine = { type: 'line', content: line };

    if (parent) {
      parent.children.push(logLine);
    } else {
      result.push(logLine);
    }
  });

  return result;
}


// Log Step Component
const LogStepComponent: React.FC<{ step: LogStep; initialOpen?: boolean }> = ({ step, initialOpen = false }) => {
    return (
        <Collapsible defaultOpen={initialOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-sm -ml-1">
                    <ChevronRight className="size-4" />
                    <span className="font-medium text-sm">{step.title}</span>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="pl-6 border-l border-dashed ml-2 my-1">
                   {step.children.map((child, index) => {
                       if (child.type === 'step') {
                           return <LogStepComponent key={index} step={child} />;
                       }
                       // Strip timestamps
                       const cleanContent = child.content.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3,7}Z\s/, '');
                       return <p key={index} className="whitespace-pre-wrap">{cleanContent}</p>;
                   })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

// Main Dialog Component
interface BuildLogsDialogProps {
  build: Build & { repo: string }
  onOpenChange: (open: boolean) => void
}

export function BuildLogsDialog({ build, onOpenChange }: BuildLogsDialogProps) {
  const [logs, setLogs] = React.useState<{ [key: string]: string } | null>(null)
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
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
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
              {Object.entries(logs).map(([jobName, logContent]) => {
                const parsedLog = parseGitHubLogs(logContent);
                return (
                  <AccordionItem value={jobName} key={jobName}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Terminal className="size-4" />
                        <span>{jobName}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Collapsible defaultOpen className="group/collapsible">
                        <CollapsibleContent>
                          <ScrollArea className="h-96 w-full rounded-md border bg-muted/50 p-2">
                              <div className="p-4 text-xs font-mono space-y-1">
                                  {parsedLog.map((item, index) => {
                                      if (item.type === 'step') {
                                          return <LogStepComponent key={index} step={item} initialOpen={item.children.length > 0} />
                                      }
                                      return <p key={index} className="whitespace-pre-wrap">{item.content}</p>
                                  })}
                              </div>
                          </ScrollArea>
                        </CollapsibleContent>
                      </Collapsible>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
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
