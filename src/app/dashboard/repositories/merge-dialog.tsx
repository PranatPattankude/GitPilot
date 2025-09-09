

"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import type { Repository, ChangedFile } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { GitMerge, GitPullRequest, CheckCircle, AlertTriangle, Info, Loader, ChevronsUpDown } from "lucide-react"
import { compareBranches, getRepoDetails, mergePullRequest } from "./actions"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"


interface MergeDialogProps {
  repo: Repository
  onOpenChange: (open: boolean) => void
  onMerge: (repoFullName: string, sourceBranch: string, targetBranch: string, isDraft: boolean) => Promise<{ success: boolean; data?: any; error?: string }>
}

type ComparisonStatus = "idle" | "comparing" | "can-merge" | "has-conflicts" | "no-changes" | "error"
type PRInfo = { number: number; url: string; files: ChangedFile[] } | null

function BranchCombobox({ value, onChange, branches, placeholder }: { value: string, onChange: (value: string) => void, branches: string[], placeholder: string }) {
    const [open, setOpen] = useState(false)
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value ? value : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search branch..." />
                    <CommandList>
                        <CommandEmpty>No branch found.</CommandEmpty>
                        <ScrollArea className="h-48">
                            <CommandGroup>
                                {branches.map((branch) => (
                                    <CommandItem
                                        key={branch}
                                        value={branch}
                                        onSelect={() => {
                                            onChange(branch === value ? "" : branch)
                                            setOpen(false)
                                        }}
                                    >
                                        <CheckCircle className={cn("mr-2 h-4 w-4", value === branch ? "opacity-100" : "opacity-0")} />
                                        {branch}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function MergeDialog({ repo, onOpenChange, onMerge }: MergeDialogProps) {
  const [sourceBranch, setSourceBranch] = useState("")
  const [targetBranch, setTargetBranch] = useState("")
  const [branches, setBranches] = useState<string[]>(repo.branches || []);
  const [loadingDetails, setLoadingDetails] = useState(!repo.branches);
  const [comparisonStatus, setComparisonStatus] = useState<ComparisonStatus>("idle")
  const [comparisonError, setComparisonError] = useState<string | null>(null)
  const [pullRequestInfo, setPullRequestInfo] = useState<PRInfo>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComparing, setIsComparing] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    async function fetchDetails() {
        if (!repo.branches) {
            try {
                const details = await getRepoDetails(repo.fullName);
                setBranches(details.branches);
                setTargetBranch(details.branches.includes('main') ? 'main' : details.branches[0] || "");
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not fetch repository branches." });
            } finally {
                setLoadingDetails(false);
            }
        } else {
             setTargetBranch(repo.branches.includes('main') ? 'main' : repo.branches[0] || "");
        }
    }
    fetchDetails();
  }, [repo, toast]);

  useEffect(() => {
    // Reset comparison status if branches change
    setComparisonStatus("idle")
    setComparisonError(null)
    setPullRequestInfo(null)
  }, [sourceBranch, targetBranch])
  
   const handleCompare = async () => {
      if (!sourceBranch || !targetBranch) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "Please select both a source and target branch.",
          })
          return
      }
      if (sourceBranch === targetBranch) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "Source and target branches cannot be the same.",
          })
          return
      }

      setIsComparing(true);
      setComparisonStatus("comparing");
      setComparisonError(null);
      setPullRequestInfo(null);
      
      try {
        const compareResult = await compareBranches(repo.fullName, sourceBranch, targetBranch);
        setComparisonStatus(compareResult.status);
        if (compareResult.error) {
            setComparisonError(compareResult.error);
        }
        if (compareResult.pr) {
            setPullRequestInfo(compareResult.pr);
        }
      } catch (e: any) {
          setComparisonStatus("error");
          setComparisonError(e.message || "An unexpected error occurred.");
      } finally {
          setIsComparing(false);
      }
  }
  
  const handleMerge = async () => {
      setIsProcessing(true);
      try {
        if (comparisonStatus === 'has-conflicts') {
            toast({
                title: "Draft PR Created",
                description: "A draft PR has been created. Please resolve the conflicts.",
            });
            onOpenChange(false);
            return;
        }

        const prResult = await onMerge(repo.fullName, `${repo.owner.login}:${sourceBranch}`, targetBranch, false);
        
        if (prResult.success) {
            onOpenChange(false);
        }

      } catch (e: any) {
          toast({ variant: "destructive", title: "Error", description: "Merge failed: " + e.message });
      } finally {
          setIsProcessing(false);
      }
  }
  
  const firstConflictingFile = pullRequestInfo?.files?.[0]?.filename;


  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create and Merge PR in {repo.name}</DialogTitle>
          <DialogDescription>
            Select branches to compare, then create and merge a pull request. Conflicts will result in a draft PR.
          </DialogDescription>
        </DialogHeader>
        {loadingDetails ? (
            <div className="py-4 space-y-4">
                <Loader className="mx-auto size-8 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">Loading branches...</p>
            </div>
        ) : (
            <>
                <div className="py-4 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source-branch">Source Branch</Label>
                      <BranchCombobox
                        value={sourceBranch}
                        onChange={setSourceBranch}
                        branches={branches.filter(b => b !== targetBranch)}
                        placeholder="Select source..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target-branch">Target Branch</Label>
                      <BranchCombobox
                        value={targetBranch}
                        onChange={setTargetBranch}
                        branches={branches.filter(b => b !== sourceBranch)}
                        placeholder="Select target..."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {comparisonStatus === 'idle' && (
                        <div className="p-3 rounded-md bg-muted/50 text-muted-foreground border flex items-center gap-2 text-sm">
                            <Info className="size-4" />
                            <p>Select branches to start the comparison.</p>
                        </div>
                    )}
                    {comparisonStatus === 'comparing' && (
                        <div className="p-3 rounded-md bg-muted/50 text-muted-foreground border flex items-center gap-2 text-sm">
                            <Loader className="size-4 animate-spin" />
                            <p>Comparing branches...</p>
                        </div>
                    )}
                    {comparisonStatus === "can-merge" && !isComparing && (
                        <div className="p-3 rounded-md bg-accent/20 text-accent-foreground border border-accent/50 flex items-center gap-2 text-sm">
                            <CheckCircle className="size-4 text-accent" />
                            <p>Branches can be merged cleanly.</p>
                        </div>
                    )}
            
                    {comparisonStatus === "has-conflicts" && !isComparing && (
                         <div className="p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex flex-col items-start gap-2 text-sm">
                           <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4" />
                                <p>{comparisonError || "Merge conflicts detected."}</p>
                           </div>
                           {pullRequestInfo && firstConflictingFile && (
                            <Button asChild variant="link" size="sm" className="h-auto p-0 text-destructive font-bold">
                                <Link href={`/dashboard/merge/${repo.fullName}/${pullRequestInfo.number}/${encodeURIComponent(firstConflictingFile)}`}>
                                    Resolve Conflicts
                                </Link>
                            </Button>
                           )}
                        </div>
                    )}
            
                    {comparisonStatus === "no-changes" && !isComparing && (
                        <div className="p-3 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 flex items-center gap-2 text-sm">
                            <Info className="size-4" />
                            <p>No changes detected between the selected branches.</p>
                        </div>
                    )}
            
                    {comparisonStatus === "error" && !isComparing && (
                         <div className="p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2 text-sm">
                            <AlertTriangle className="size-4" />
                            <p>{comparisonError || "An unexpected error occurred."}</p>
                        </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  {comparisonStatus === 'idle' || comparisonStatus === 'comparing' ? (
                     <Button onClick={handleCompare} disabled={isComparing || !sourceBranch || !targetBranch}>
                        {isComparing ? <Loader className="mr-2 size-4 animate-spin" /> : <GitMerge className="mr-2 size-4" />}
                        {isComparing ? 'Comparing...' : 'Compare Branches'}
                      </Button>
                  ): (
                     <Button onClick={handleMerge} disabled={isProcessing || comparisonStatus === 'no-changes' || comparisonStatus === 'error' || comparisonStatus === 'has-conflicts'}>
                        {isProcessing ? <Loader className="mr-2 size-4 animate-spin" /> : <GitPullRequest className="mr-2 size-4" />}
                        {isProcessing ? 'Merging...' : 'Create & Merge PR'}
                      </Button>
                  )}
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  )
}
