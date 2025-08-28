
"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { GitMerge, GitPullRequest, AlertTriangle, XCircle } from "lucide-react"
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

interface BulkMergeDialogProps {
  onOpenChange: (open: boolean) => void
}

const conflictRepo = { id: '3', name: 'react-fire-hooks', owner: 'acme-corp', url: 'https://github.com/acme-corp/react-fire-hooks', lastUpdated: '5 minutes ago' };

// Statically defined branches for demonstration purposes.
const availableBranches = ["main", "develop", "feature/new-auth", "fix/caching-issue", "hotfix/prod-login", "feature/new-ui", "feature/analytics", "feature/sidebar-v2", "dev-k8s", "MSRMH-TRN", "qa-k8s", "KPMC-UAT", "perf-k8s", "Selgate-SIT", "Sriphat-SIT", "UCSI-UAT", "HUMS-DEV"]


export function BulkMergeDialog({ onOpenChange }: BulkMergeDialogProps) {
  const { selectedRepos } = useAppStore()
  const [sourceBranch, setSourceBranch] = useState("feature/new-auth")
  const [targetBranch, setTargetBranch] = useState("main")
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonDone, setComparisonDone] = useState(false)

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
    return null;
  }

  const reposMissingBranch = comparisonDone ? selectedRepos.map(repo => ({
      repo,
      reason: getSkippedRepoInfo(repo)
  })).filter(item => item.reason !== null) : [];

  const reposWithConflicts = comparisonDone ? selectedRepos.filter(repo => repo.id === conflictRepo.id && !reposMissingBranch.find(r => r.repo.id === repo.id)) : [];
  const cleanRepos = comparisonDone ? selectedRepos.filter(repo => !reposMissingBranch.find(r => r.repo.id === repo.id) && !reposWithConflicts.find(r => r.id === repo.id)) : [];


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
                    <Button onClick={handleCompare} disabled={isComparing || !sourceBranch || !targetBranch}>
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
                                    <p className="text-sm text-muted-foreground">{repo.owner}</p>
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
                                <p className="text-sm text-muted-foreground">{repo.owner}</p>
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
                                    <p className="text-sm text-muted-foreground">{repo.owner}</p>
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
                        <Button size="lg" className="bg-accent hover:bg-accent/90" disabled={cleanRepos.length === 0 && reposWithConflicts.length === 0}>
                            <GitPullRequest className="mr-2 size-4" />
                            Merge All Clean Branches
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
