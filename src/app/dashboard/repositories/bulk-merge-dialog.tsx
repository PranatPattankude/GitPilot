

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
import { GitMerge, GitPullRequest, AlertTriangle, XCircle, Loader, FolderCog, Info, CheckCircle, ExternalLink, ChevronsUpDown } from "lucide-react"
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
    hasWorkflows: boolean;
    error?: string;
    pullRequest?: {
        number: number;
        url: string;
    };
}

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

export function BulkMergeDialog({ onOpenChange }: BulkMergeDialogProps) {
  const { selectedRepos, startBulkBuild, clearRepos } = useAppStore()
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
    setComparisonStatuses(selectedRepos.map(repo => ({ repo, status: 'pending', hasWorkflows: false })));

    try {
        const repoFullNames = selectedRepos.map(r => r.fullName);
        const workflowStatus = await checkWorkflowsExistence(repoFullNames);

        await Promise.all(selectedRepos.map(async (repo, index) => {
            const hasWorkflows = workflowStatus[repo.fullName] || false;
            const updateStatus = (newStatus: Partial<RepoComparisonStatus>) => {
                setComparisonStatuses(prev => {
                    const newStatuses = [...prev];
                    newStatuses[index] = { ...newStatuses[index], ...newStatuses[index], ...newStatus, hasWorkflows };
                    return newStatuses;
                });
            };
            
            const repoBranches = repo.branches || [];
            if (!repoBranches.includes(sourceBranch) || !repoBranches.includes(targetBranch)) {
                updateStatus({ status: 'skipped-no-branches', error: `One or both branches missing. Repo has: ${repoBranches.slice(0,3).join(', ')}...` });
                return;
            }
            
            if (sourceBranch === targetBranch) {
                updateStatus({ status: 'error', error: "Source and target branches cannot be the same." });
                return;
            }
            
            const compareResult = await compareBranches(repo.fullName, sourceBranch, targetBranch);
            
            if (compareResult.status === "has-conflicts" && compareResult.pr) {
                 updateStatus({ 
                    status: 'has-conflicts', 
                    error: compareResult.error,
                    pullRequest: { number: compareResult.pr.number, url: compareResult.pr.url }
                });
            } else if (compareResult.status === 'can-merge') {
                 updateStatus({ status: 'can-merge' });
            } else {
                updateStatus({ status: compareResult.status, error: compareResult.error });
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
    
    // Create PRs for all clean repos first
    const prCreationResults = await Promise.all(cleanReposForMerge.map(async (repoStatus) => {
        const prResult = await createPullRequest(repoStatus.repo.fullName, `${repoStatus.repo.owner.login}:${sourceBranch}`, targetBranch, false);
        if (prResult.success && prResult.data) {
            return { ...repoStatus, pullRequest: { number: prResult.data.number, url: prResult.data.html_url } };
        }
        toast({ variant: "destructive", title: `Failed to create PR for ${repoStatus.repo.name}`, description: prResult.error });
        return { ...repoStatus, status: 'error', error: prResult.error };
    }));
    
    const successfulPrs = prCreationResults.filter(r => r.status === 'can-merge' && r.pullRequest);
    const reposWithWorkflows = successfulPrs.filter(r => r.hasWorkflows);
    const reposWithoutWorkflows = successfulPrs.filter(r => !r.hasWorkflows);
    
    const shouldRedirect = reposWithWorkflows.length > 0;
    
    try {
        if (shouldRedirect) {
            const reposForBuildPage = reposWithWorkflows.map(s => ({
                name: s.repo.name,
                status: 'Queued',
                commit: '...'.padStart(7, '.'),
                duration: '-',
                timestamp: new Date(),
                prUrl: s.pullRequest?.url,
                prNumber: s.pullRequest?.number,
                id: s.pullRequest!.number.toString(),
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

            await addReleaseToHistory({
                type: 'bulk',
                repos: reposWithWorkflows.map(r => r.repo.name),
                branch: `${sourceBranch} → ${targetBranch}`,
                user: user,
                status: 'In Progress'
            });

            toast({
                title: "Bulk Merge Started",
                description: `Merging ${reposWithWorkflows.length} repositories with workflows. Redirecting...`,
            });
        }
        
        if (reposWithoutWorkflows.length > 0) {
            await addReleaseToHistory({
                type: 'bulk',
                repos: reposWithoutWorkflows.map(r => r.repo.name),
                branch: `${sourceBranch} → ${targetBranch}`,
                user: user,
                status: 'Success'
            });

            toast({
                title: "Bulk Merge Successful",
                description: `Successfully merged ${reposWithoutWorkflows.length} repositories without workflows.`,
            });
        }
        
        const allPrsToMerge = successfulPrs.map(s => ({ repoFullName: s.repo.fullName, prNumber: s.pullRequest!.number }));
        if (allPrsToMerge.length > 0) {
            await mergeCleanPullRequests(allPrsToMerge);
        }

        startTransition(() => {
            onOpenChange(false);
            clearRepos();
            if (shouldRedirect) {
                router.push('/dashboard/builds');
            } else {
                router.refresh(); 
            }
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
                                value={sourceBranch}
                                onChange={setSourceBranch}
                                branches={availableBranches.filter(b => b !== targetBranch)}
                                placeholder="Select source..."
                             />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target-branch">Target Branch</Label>
                             <BranchCombobox 
                                value={targetBranch}
                                onChange={setTargetBranch}
                                branches={availableBranches.filter(b => b !== sourceBranch)}
                                placeholder="Select target..."
                             />
                        </div>
                    </div>
                    <Button onClick={handleCompare} disabled={isComparing || !sourceBranch || !targetBranch || sourceBranch === targetBranch}>
                        {isComparing && <Loader className="mr-2 h-4 w-4 animate-spin"/>}
                        {isComparing ? "Comparing..." : "2. Compare Repositories"}
                    </Button>
                    </CardContent>
                </Card>

                {comparisonStatuses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Review and Merge</CardTitle>
                            <CardDescription>
                            Review the status of each repository. Repositories with conflicts or missing branches will be skipped. You can then merge all clean PRs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-72">
                                <ul className="space-y-3 pr-4">
                                {comparisonStatuses.map(({ repo, status, error, pullRequest }) => {
                                    const { icon: Icon, text, color, bg, animation } = getStatusInfo(status);
                                    const firstConflictingFile = null; // This logic is not needed for bulk merge
                                    const encodedFilePath = firstConflictingFile ? encodeURIComponent(firstConflictingFile) : '';

                                    return (
                                        <li key={repo.id} className={`p-3 border rounded-lg ${bg}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <h4 className="font-semibold">{repo.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{repo.owner.login}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                   {status === 'has-conflicts' && pullRequest && (
                                                       <Button asChild variant="destructive" size="sm" className="h-auto px-2 py-1 text-xs gap-1.5">
                                                           <Link href={`/dashboard/merge/${repo.fullName}/${pullRequest.number}/${encodedFilePath}`}>
                                                                Resolve
                                                           </Link>
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
