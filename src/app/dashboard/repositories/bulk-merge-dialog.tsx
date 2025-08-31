

"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { GitMerge, GitPullRequest, AlertTriangle, XCircle, Loader, FolderCog, CheckCircle, Info, ExternalLink } from "lucide-react"
import { useAppStore, type Repository } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { addReleaseToHistory } from "@/ai/flows/release-history"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { processBulkComparison, mergeCleanPullRequests } from "./actions"

type ComparisonResult = {
  repo: Repository;
  status: 'no-changes' | 'has-conflicts' | 'can-merge' | 'skipped-no-workflow' | 'skipped-no-branch';
  prUrl?: string;
  prNumber?: number;
  message?: string;
}

interface BulkMergeDialogProps {
  onOpenChange: (open: boolean) => void
}

export function BulkMergeDialog({ onOpenChange }: BulkMergeDialogProps) {
  const { selectedRepos, startBulkBuild } = useAppStore()
  const [sourceBranch, setSourceBranch] = useState("develop")
  const [targetBranch, setTargetBranch] = useState("main")
  const [isComparing, setIsComparing] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()

  const availableBranches = useMemo(() => {
    const allBranches = new Set<string>();
    selectedRepos.forEach(repo => {
        (repo.branches || []).forEach(branch => allBranches.add(branch));
    });
    return Array.from(allBranches).sort();
  }, [selectedRepos]);


  const handleCompare = async () => {
    setIsComparing(true)
    setComparisonResults([])
    toast({ title: "Starting Bulk Comparison...", description: `Checking ${selectedRepos.length} repositories. This may take a moment.` });
    
    try {
        const results = await processBulkComparison(selectedRepos, sourceBranch, targetBranch);
        setComparisonResults(results);
        const createdCount = results.filter(r => r.prUrl).length;
        const conflictCount = results.filter(r => r.status === 'has-conflicts').length;
        
        toast({
            title: "Comparison Complete",
            description: `Created ${createdCount} pull requests. Found ${conflictCount} repositories with conflicts.`
        });
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Error during comparison",
            description: e.message || "An unexpected error occurred."
        })
    } finally {
        setIsComparing(false)
    }
  }
  
  const cleanRepos = comparisonResults.filter(r => r.status === 'can-merge');

  const handleBulkMerge = async () => {
    if (cleanRepos.length === 0) return;
    
    setIsMerging(true)
    const user = session?.user?.name || 'Unknown User';
    
    const prsToMerge = cleanRepos.map(r => ({
      repoFullName: r.repo.fullName,
      prNumber: r.prNumber!,
    }));

    // For the UI, we'll start the build process immediately
     startBulkBuild({
        id: new Date().getTime().toString(),
        sourceBranch,
        targetBranch,
        repos: cleanRepos.map(r => ({
          name: r.repo.name,
          status: 'Queued',
          commit: '...'.padStart(7, '.'), // Placeholder
          duration: '-',
          timestamp: new Date()
        })),
        status: 'In Progress',
        duration: '0s',
        triggeredBy: user,
    });
    
    // Log to sheets
    try {
        await addReleaseToHistory({
            type: 'bulk',
            repos: cleanRepos.map(r => r.repo.name),
            branch: `${sourceBranch} → ${targetBranch}`,
            user: user,
            status: 'In Progress'
        });
    } catch(e) {
        console.error("Failed to add release to history", e);
    }
    
    // Redirect to build page
    toast({
        title: "Bulk Merge Started",
        description: `Merging ${cleanRepos.length} repositories. You are being redirected to the build status page.`,
    });
    
    startTransition(() => {
        onOpenChange(false);
        router.push('/dashboard/builds');
    });

    // Actually merge the PRs in the background
    await mergeCleanPullRequests(prsToMerge);
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
  
  const renderResult = (result: ComparisonResult) => {
    let icon, badgeVariant, message;

    switch(result.status) {
        case 'can-merge':
            icon = <CheckCircle className="size-4 text-accent" />;
            badgeVariant = "secondary";
            message = "PR created and ready to merge";
            break;
        case 'has-conflicts':
            icon = <AlertTriangle className="size-4 text-destructive" />;
            badgeVariant = "destructive";
            message = "PR created with conflicts";
            break;
        case 'no-changes':
            icon = <Info className="size-4 text-blue-500" />;
            badgeVariant = "outline";
            message = "Branches are identical";
            break;
        case 'skipped-no-workflow':
            icon = <FolderCog className="size-4 text-muted-foreground" />;
            badgeVariant = "outline";
            message = "Skipped: No workflow found";
            break;
        case 'skipped-no-branch':
            icon = <XCircle className="size-4 text-muted-foreground" />;
            badgeVariant = "outline";
            message = `Skipped: ${result.message}`;
            break;
        default:
            icon = <XCircle className="size-4 text-muted-foreground" />;
            badgeVariant = "outline";
            message = "Skipped";
    }

    return (
        <li key={result.repo.id} className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold">{result.repo.name}</h4>
                    <p className="text-sm text-muted-foreground">{result.repo.owner.login}</p>
                </div>
                <div className="flex items-center gap-4">
                     {result.prUrl && (
                        <Button variant="ghost" size="sm" asChild>
                            <a href={result.prUrl} target="_blank" rel="noopener noreferrer">
                                PR #{result.prNumber}
                                <ExternalLink className="ml-2 size-3" />
                            </a>
                        </Button>
                     )}
                     <Badge variant={badgeVariant} className="flex items-center gap-2">
                        {icon}
                        {message}
                    </Badge>
                </div>
            </div>
        </li>
    )
  }

  return (
     <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Bulk Branch Merging</DialogTitle>
                <DialogDescription>
                    Compare and merge branches across your selected repositories.
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
                            <Select value={sourceBranch} onValueChange={setSourceBranch}>
                                <SelectTrigger id="source-branch">
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableBranches.map((branch) => (
                                    <SelectItem key={branch} value={branch} disabled={branch === targetBranch}>
                                        {branch}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target-branch">Target Branch</Label>
                            <Select value={targetBranch} onValueChange={setTargetBranch}>
                            <SelectTrigger id="target-branch">
                                <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableBranches.map((branch) => (
                                <SelectItem key={branch} value={branch} disabled={branch === sourceBranch}>
                                    {branch}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleCompare} disabled={isComparing || !sourceBranch || !targetBranch || sourceBranch === targetBranch}>
                        {isComparing && <Loader className="mr-2 h-4 w-4 animate-spin"/>}
                        {isComparing ? "Comparing..." : "Compare & Create PRs"}
                    </Button>
                    </CardContent>
                </Card>

                {comparisonResults.length > 0 && (
                    <Card>
                    <CardHeader>
                        <CardTitle>2. Review and Merge</CardTitle>
                        <CardDescription>
                        Pull requests have been created. Repositories with conflicts or no changes are identified. Review and then merge all clean branches.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                          {comparisonResults.map(renderResult)}
                        </ul>
                    </CardContent>
                     <DialogFooter className="pr-6 pt-6 border-t">
                        <Button size="lg" className="bg-accent hover:bg-accent/90" disabled={cleanRepos.length === 0 || isMerging || isPending} onClick={handleBulkMerge}>
                            {(isMerging || isPending) ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <GitPullRequest className="mr-2 size-4" />}
                            Merge All Clean Pull Requests ({cleanRepos.length})
                        </Button>
                    </DialogFooter>
                    </Card>
                )}
            </div>
        </DialogContent>
     </Dialog>
  )
}
