
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
import { AlertTriangle, Terminal, ChevronRight, CheckCircle, XCircle } from "lucide-react"
import { type Build } from "@/lib/store"
import { getBuildLogs } from "../repositories/actions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Log Parsing Logic
type LogLine = { type: 'line'; content: string };
type LogStep = { type: 'step'; title: string; children: (LogLine | LogStep)[]; outcome?: 'success' | 'failure' };
type ParsedLog = (LogLine | LogStep)[];

function parseGitHubLogs(logContent: string): ParsedLog {
  const lines = logContent.split('\n');
  const result: ParsedLog = [];
  const stack: LogStep[] = [];

  const outcomeRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3,7}Z ##\[step-outcome]\s*outcome=(success|failure),stepTitle=(.*)/;

  lines.forEach(line => {
    const groupStartMatch = line.match(/##\[group](.*)/);
    if (groupStartMatch) {
      const newStep: LogStep = { type: 'step', title: groupStartMatch[1].trim(), children: [] };
      const parent = stack.length > 0 ? stack[stack.length - 1] : null;
      if (parent) {
        parent.children.push(newStep);
      } else {
        result.push(newStep);
      }
      stack.push(newStep);
      return;
    }

    const groupEndMatch = line.match(/##\[endgroup]/);
    if (groupEndMatch) {
      const finishedStep = stack.pop();
      if (finishedStep && !finishedStep.outcome) {
          // If no explicit outcome was found, assume success for any ended group
          // This handles cases where steps complete without a specific outcome line
          // but are visually grouped.
          finishedStep.outcome = 'success';
      }
      return;
    }

    const outcomeMatch = line.match(outcomeRegex);
    if (outcomeMatch) {
        const [, outcome, stepTitle] = outcomeMatch;
        // This outcome belongs to the *last* step that was pushed to the stack
        // that matches the title, which is usually the one that just finished.
        const stepToUpdate = (stack.length > 0 ? stack[stack.length - 1].children : result)
            .slice()
            .reverse()
            .find(s => s.type === 'step' && s.title === stepTitle) as LogStep;

        if (stepToUpdate) {
            stepToUpdate.outcome = outcome as 'success' | 'failure';
        }
        return; // Don't add this meta-line to the visible log
    }


    const parent = stack.length > 0 ? stack[stack.length - 1] : null;
    const logLine: LogLine = { type: 'line', content: line };

    if (parent) {
      parent.children.push(logLine);
    } else {
      result.push(logLine);
    }
  });
  
  // Ensure any remaining steps on the stack (e.g. for logs that end abruptly)
  // are marked as success if they don't have a failure.
  stack.forEach(step => {
    if (!step.outcome) step.outcome = 'success';
  });


  return result;
}


// Log Step Component
const LogStepComponent: React.FC<{ step: LogStep; initialOpen?: boolean }> = ({ step, initialOpen = false }) => {
    const [isOpen, setIsOpen] = React.useState(initialOpen);

    const OutcomeIcon = step.outcome === 'success' ? CheckCircle : step.outcome === 'failure' ? XCircle : ChevronRight;
    const outcomeColor = step.outcome === 'success' ? 'text-green-500' : step.outcome === 'failure' ? 'text-destructive' : 'text-muted-foreground';
    const isJustChevron = !step.outcome || (step.outcome !== 'success' && step.outcome !== 'failure');

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-sm -ml-1">
                    <ChevronRight className={cn("size-4 transition-transform duration-200", isOpen ? 'rotate-90' : '', isJustChevron ? 'text-muted-foreground' : 'text-transparent')} />
                    <OutcomeIcon className={cn("size-4 -ml-6", outcomeColor, isJustChevron ? 'hidden' : '')} />
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
