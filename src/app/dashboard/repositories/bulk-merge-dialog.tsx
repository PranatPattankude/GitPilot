
"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { GitMerge, GitPullRequest, AlertTriangle, XCircle, Loader } from "lucide-react"
import { useAppStore, type Repository } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import ConflictResolver from "../merge/conflict-resolver"
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

interface BulkMergeDialogProps {
  onOpenChange: (open: boolean) => void
}

const conflictRepo = { id: '3', name: 'react-fire-hooks', owner: 'acme-corp', url: 'https://github.com/acme-corp/react-fire-hooks', lastUpdated: '5 minutes ago' };

export function BulkMergeDialog({ onOpenChange }: BulkMergeDialogProps) {
  const { selectedRepos, startBulkBuild } = useAppStore()
  const [sourceBranch, setSourceBranch] = useState("develop")
  const [targetBranch, setTargetBranch] = useState("main")
  const [isComparing, setIsComparing] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [comparisonDone, setComparisonDone] = useState(false)
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


  const handleCompare = () => {
    setIsComparing(true)
    setTimeout(() => {
      setIsComparing(false)
      setComparisonDone(true)
    }, 1500)
  }

  const getSkippedRepoInfo = (repo: Repository) => {
    const repoBranches = repo.branches || [];
    const hasSource = repoBranches.includes(sourceBranch);
    const hasTarget = repoBranches.includes(targetBranch);
    if (!hasSource && !hasTarget) return `Source & Target branch not found`;
    if (!hasSource) return `Source branch not found`;
    if (!hasTarget) return `Target branch not found`;
    if (sourceBranch === targetBranch) return `Source and Target branches are the same`;
    return null;
  }

  const reposMissingBranch = comparisonDone ? selectedRepos.map(repo => ({
      repo,
      reason: getSkippedRepoInfo(repo)
  })).filter(item => item.reason !== null) : [];

  const reposWithConflicts = comparisonDone ? selectedRepos.filter(repo => repo.id === conflictRepo.id && !reposMissingBranch.find(r => r.repo.id === repo.id)) : [];
  const cleanRepos = comparisonDone ? selectedRepos.filter(repo => !reposMissingBranch.find(r => r.repo.id === repo.id) && !reposWithConflicts.find(r => r.id === repo.id)) : [];


  const handleBulkMerge = async () => {
    setIsMerging(true)
    
    // In a real app, you would loop through `cleanRepos` and call the merge actions.
    // For now, we'll simulate the process and set up the state for the builds page.
    startBulkBuild({
        id: new Date().getTime().toString(),
        sourceBranch,
        targetBranch,
        repos: cleanRepos.map(repo => ({
          name: repo.name,
          status: 'Queued',
          commit: '...'.padStart(7, '.'), // Placeholder
          duration: '-',
          timestamp: new Date()
        })),
        status: 'In Progress',
        duration: '0s',
        timestamp: new Date()
    });

    try {
        await addReleaseToHistory({
            type: 'bulk',
            repos: cleanRepos.map(r => r.name),
            branch: `${sourceBranch} → ${targetBranch}`,
            user: session?.user?.name || 'Unknown User',
            status: 'In Progress'
        });
    } catch(e) {
        console.error("Failed to add release to history", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not log release to Google Sheets. Check console for details.",
        });
    }

    toast({
        title: "Bulk Build Started",
        description: `Merging ${cleanRepos.length} repositories. You are being redirected to the build status page.`,
    });
    
    startTransition(() => {
        onOpenChange(false);
        router.push('/dashboard/builds');
    })

    // No need to set isMerging to false as we are navigating away.
  }

  const hasConflicts = (repoId: string) => reposWithConflicts.some(r => r.id === repoId);

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
                    <CardTitle>Select Branches</CardTitle>
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
                        {isComparing && <Loader className="mr-2 animate-spin"/>}
                        {isComparing ? "Comparing..." : "Compare Branches"}
                    </Button>
                    </CardContent>
                </Card>

                {comparisonDone && (
                    <Card>
                    <CardHeader>
                        <CardTitle>Comparison Result</CardTitle>
                        <CardDescription>
                        Review the status of each repository before proceeding with the merge.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                        {reposMissingBranch.length > 0 && (
                          <>
                           <h3 className="text-lg font-semibold text-muted-foreground">Skipped Repositories</h3>
                            {reposMissingBranch.map(({ repo, reason }) => (
                                <li key={repo.id} className="p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                    <h4 className="font-semibold">{repo.name}</h4>
                                    <p className="text-sm text-muted-foreground">{repo.owner.login}</p>
                                    </div>
                                    <Badge variant="outline" className="flex items-center gap-2 text-muted-foreground border-dashed">
                                        <XCircle className="size-4" />
                                        {reason}
                                    </Badge>
                                </div>
                                </li>
                            ))}
                          </>
                        )}
                        
                        {(cleanRepos.length > 0 || reposWithConflicts.length > 0) && <h3 className="text-lg font-semibold text-muted-foreground mt-4">Ready for Merge</h3>}

                        {cleanRepos.map((repo) => (
                           <li key={repo.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                <h4 className="font-semibold">{repo.name}</h4>
                                <p className="text-sm text-muted-foreground">{repo.owner.login}</p>
                                </div>
                               <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/50">Can be merged cleanly</Badge>
                            </div>
                            </li>
                        ))}

                        {reposWithConflicts.map((repo) => (
                             <li key={repo.id} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                    <h4 className="font-semibold">{repo.name}</h4>
                                    <p className="text-sm text-muted-foreground">{repo.owner.login}</p>
                                    </div>
                                    <Badge variant="destructive" className="flex items-center gap-2">
                                        <AlertTriangle className="size-4" />
                                        Conflicts found
                                    </Badge>
                                </div>
                                <Separator className="my-4" />
                                <ConflictResolver />
                                </li>
                        ))}
                        </ul>
                        <div className="flex justify-end mt-6">
                        <Button size="lg" className="bg-accent hover:bg-accent/90" disabled={cleanRepos.length === 0 || reposWithConflicts.length > 0 || isMerging || isPending} onClick={handleBulkMerge}>
                            {(isMerging || isPending) ? <Loader className="mr-2 animate-spin" /> : <GitPullRequest className="mr-2 size-4" />}
                            Merge All Clean Branches ({cleanRepos.length})
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
