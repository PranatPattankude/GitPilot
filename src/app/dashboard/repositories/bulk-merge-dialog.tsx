

"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { GitMerge, GitPullRequest, AlertTriangle, XCircle, Loader, FolderCog, Info, CheckCircle, ExternalLink, RefreshCw, ChevronsUpDown, Check } from "lucide-react"
import { useAppStore, type Repository } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { addReleaseToHistory } from "@/ai/flows/release-history"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { checkWorkflowsExistence, compareBranches, createPullRequest, mergeCleanPullRequests } from "./actions"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface BulkMergeDialogProps {
  onOpenChange: (open: boolean) => void
}

type RepoComparisonStatus = {
    repo: Repository;
    status: 'pending' | 'no-changes' | 'has-conflicts' | 'can-merge' | 'skipped-no-workflows' | 'skipped-no-branches' | 'error';
    error?: string;
    pullRequest?: {
        number: number;
        url: string;
    };
}

function BranchCombobox({
  branches,
  value,
  onChange,
  disabledBranch,
  placeholder,
}: {
  branches: string[]
  value: string
  onChange: (value: string) => void
  disabledBranch?: string
  placeholder: string
}) {
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
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search branch..." />
          <CommandEmpty>No branch found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {branches.map((branch) => (
                <CommandItem
                  key={branch}
                  value={branch}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  disabled={branch === disabledBranch}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === branch ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {branch}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function BulkMergeDialog({ onOpenChange }: BulkMergeDialogProps) {
  const { selectedRepos, startBulkBuild } = useAppStore()
  const [sourceBranch, setSourceBranch] = useState("develop")
  const [targetBranch, setTargetBranch] = useState("main")
  const [comparisonStatuses, setComparisonStatuses] = useState<RepoComparisonStatus[]>([]);
  const [isComparing, setIsComparing] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const availableBranches = useMemo(() => {
    const allBranches = new Set<string>();
    selectedRepos.forEach(repo => {
        (repo.branches || []).forEach(branch => allBranches.add(branch));
    });
    return Array.from(allBranches).sort();
  }, [selectedRepos]);


  const handleCompare = async () => {
    setIsComparing(true);
    setComparisonStatuses(selectedRepos.map(repo => ({ repo, status: 'pending' })));

    try {
        const repoFullNames = selectedRepos.map(r => r.fullName);
        const workflowStatus = await checkWorkflowsExistence(repoFullNames);

        await Promise.all(selectedRepos.map(async (repo, index) => {
            const updateStatus = (newStatus: Partial<RepoComparisonStatus>) => {
                setComparisonStatuses(prev => {
                    const newStatuses = [...prev];
                    newStatuses[index] = { ...newStatuses[index], ...newStatus };
                    return newStatuses;
                });
            };

            const repoBranches = repo.branches || [];
            if (!repoBranches.includes(sourceBranch) || !repoBranches.includes(targetBranch)) {
                updateStatus({ status: 'skipped-no-branches', error: 'Source or target branch not found' });
                return;
            }

            if (!workflowStatus[repo.fullName]) {
                updateStatus({ status: 'skipped-no-workflows', error: 'No active CI/CD workflows found' });
                return;
            }
            
            const compareResult = await compareBranches(repo.fullName, sourceBranch, targetBranch);
            updateStatus({ status: compareResult.status, error: compareResult.error });
            
            // If there are changes or conflicts, create a PR
            if (compareResult.status === 'can-merge' || compareResult.status === 'has-conflicts') {
                const isDraft = compareResult.status === 'has-conflicts';
                const prResult = await createPullRequest(repo.fullName, sourceBranch, targetBranch, isDraft);
                if (prResult.success && prResult.data) {
                    updateStatus({ pullRequest: { number: prResult.data.number, url: prResult.data.html_url } });
                } else {
                     updateStatus({ status: 'error', error: prResult.error || 'Failed to create Pull Request' });
                }
            }
        }));
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Error during comparison",
            description: e.message || "An unexpected error occurred."
        });
    } finally {
        setIsComparing(false);
    }
  };
  
  const handleBulkMerge = async () => {
    setIsMerging(true);
    const user = session?.user?.name || 'Unknown User';

    const cleanReposForMerge = comparisonStatuses.filter(s => s.status === 'can-merge');
    
    if (cleanReposForMerge.length === 0) {
        toast({ title: "Nothing to Merge", description: "There are no repositories ready for a clean merge." });
        setIsMerging(false);
        return;
    }
    
    const reposForBuildPage = cleanReposForMerge.map(s => ({
        name: s.repo.name,
        status: 'Queued',
        commit: '...'.padStart(7, '.'), // Placeholder
        duration: '-',
        timestamp: new Date(),
        prUrl: s.pullRequest?.url,
        prNumber: s.pullRequest?.number,
    }));

    startBulkBuild({
        id: new Date().getTime().toString(),
        sourceBranch,
        targetBranch,
        repos: reposForBuildPage as any,
        status: 'In Progress',
        duration: '0s',
        timestamp: new Date(),
        triggeredBy: user,
    });
    
    try {
      const pullRequestsToMerge = cleanReposForMerge
        .filter(s => s.pullRequest)
        .map(s => ({ repoFullName: s.repo.fullName, prNumber: s.pullRequest!.number }));

      await mergeCleanPullRequests(pullRequestsToMerge);
      
      await addReleaseToHistory({
          type: 'bulk',
          repos: cleanReposForMerge.map(r => r.repo.name),
          branch: `${sourceBranch} → ${targetBranch}`,
          user: user,
          status: 'In Progress'
      });

      toast({
          title: "Bulk Merge Started",
          description: `Merging ${cleanReposForMerge.length} repositories. You are being redirected to the build status page.`,
      });
      
      startTransition(() => {
          onOpenChange(false);
          router.push('/dashboard/builds');
      });

    } catch (e: any) {
       console.error("Failed during bulk merge process", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "Could not complete bulk merge. Check console for details.",
        });
        setIsMerging(false);
    }
  };

  const getStatusInfo = (status: RepoComparisonStatus['status']) => {
    switch (status) {
      case 'can-merge':
        return { icon: CheckCircle, text: 'Ready to Merge', color: 'text-accent', bg: 'bg-accent/10' };
      case 'has-conflicts':
        return { icon: AlertTriangle, text: 'Conflicts Found', color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'no-changes':
        return { icon: Info, text: 'No Changes', color: 'text-sky-500', bg: 'bg-sky-500/10' };
      case 'skipped-no-workflows':
        return { icon: FolderCog, text: 'Skipped (No Workflows)', color: 'text-muted-foreground', bg: 'bg-muted/50' };
      case 'skipped-no-branches':
        return { icon: XCircle, text: 'Skipped (Branch Missing)', color: 'text-muted-foreground', bg: 'bg-muted/50' };
      case 'error':
        return { icon: XCircle, text: 'Error', color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'pending':
        return { icon: Loader, text: 'Comparing...', color: 'text-primary', bg: 'bg-transparent', animation: 'animate-spin' };
      default:
        return { icon: Loader, text: 'Pending...', color: 'text-muted-foreground', bg: 'bg-muted/50' };
    }
  }

  if (selectedRepos.length === 0) {
    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>No Repositories Selected</DialogTitle>
                    <DialogDescription>
                         Please go back to the repositories page and select at least one repository to merge.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
  }

  const cleanReposCount = comparisonStatuses.filter(s => s.status === 'can-merge').length;

  return (
     <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Bulk Branch Merging</DialogTitle>
                <DialogDescription>
                    Compare branches, create Pull Requests, and merge them across multiple repositories.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle>1. Select Branches</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="source-branch">Source Branch</Label>
                            <BranchCombobox
                                branches={availableBranches}
                                value={sourceBranch}
                                onChange={setSourceBranch}
                                disabledBranch={targetBranch}
                                placeholder="Select a source branch"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target-branch">Target Branch</Label>
                            <BranchCombobox
                                branches={availableBranches}
                                value={targetBranch}
                                onChange={setTargetBranch}
                                disabledBranch={sourceBranch}
                                placeholder="Select a target branch"
                            />
                        </div>
                    </div>
                    <Button onClick={handleCompare} disabled={isComparing || !sourceBranch || !targetBranch || sourceBranch === targetBranch}>
                        {isComparing && <Loader className="mr-2 h-4 w-4 animate-spin"/>}
                        {isComparing ? "Comparing..." : "2. Compare & Create PRs"}
                    </Button>
                    </CardContent>
                </Card>

                {comparisonStatuses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Review and Merge</CardTitle>
                            <CardDescription>
                            Review the status of each repository. Pull Requests are created automatically. You can then merge all clean PRs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-72">
                                <ul className="space-y-3 pr-4">
                                {comparisonStatuses.map(({ repo, status, error, pullRequest }) => {
                                    const { icon: Icon, text, color, bg, animation } = getStatusInfo(status);
                                    return (
                                        <li key={repo.id} className={`p-3 border rounded-lg ${bg}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <h4 className="font-semibold">{repo.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{repo.owner.login}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                   {pullRequest && (
                                                        <Button variant="ghost" size="sm" asChild className="h-auto px-2 py-1 text-xs gap-1.5">
                                                            <a href={pullRequest.url} target="_blank" rel="noopener noreferrer">
                                                                View PR #{pullRequest.number}
                                                                <ExternalLink className="size-3" />
                                                            </a>
                                                        </Button>
                                                   )}
                                                    <Badge variant="outline" className={`flex items-center gap-2 text-sm ${color} border-current`}>
                                                        <Icon className={`size-4 ${animation || ''}`} />
                                                        {text}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {error && (
                                                <p className="text-xs text-destructive mt-2 pl-1">{error}</p>
                                            )}
                                        </li>
                                    );
                                })}
                                </ul>
                            </ScrollArea>
                            <div className="flex justify-end mt-6">
                            <Button size="lg" className="bg-accent hover:bg-accent/90" disabled={isComparing || cleanReposCount === 0 || isMerging || isPending} onClick={handleBulkMerge}>
                                {(isMerging || isPending) ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <GitPullRequest className="mr-2 size-4" />}
                                Merge All Clean PRs ({cleanReposCount})
                            </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DialogContent>
     </Dialog>
  )
}
