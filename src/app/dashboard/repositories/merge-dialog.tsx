
"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Repository } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { GitMerge, GitPullRequest, CheckCircle, AlertTriangle, Info, Loader } from "lucide-react"
import { compareBranches } from "./actions"

interface MergeDialogProps {
  repo: Repository
  onOpenChange: (open: boolean) => void
  onMerge: (repoFullName: string, sourceBranch: string, targetBranch: string) => Promise<{ success: boolean; data?: any; error?: string }>
}

type ComparisonStatus = "idle" | "comparing" | "can-merge" | "has-conflicts" | "no-changes"

export function MergeDialog({ repo, onOpenChange, onMerge }: MergeDialogProps) {
  const [sourceBranch, setSourceBranch] = useState("")
  const [targetBranch, setTargetBranch] = useState(repo.branches?.includes('main') ? 'main' : repo.branches?.[0] || "")
  const [comparisonStatus, setComparisonStatus] = useState<ComparisonStatus>("idle")
  const [comparisonError, setComparisonError] = useState<string | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Reset comparison status if branches change
    setComparisonStatus("idle")
    setComparisonError(null)
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

    setComparisonStatus("comparing")
    setComparisonError(null)
    try {
      const result = await compareBranches(repo.fullName, sourceBranch, targetBranch);
      setComparisonStatus(result.status);
      if(result.error) {
          setComparisonError(result.error);
      }
    } catch (e: any) {
        setComparisonStatus("has-conflicts");
        setComparisonError(e.message || "An unexpected error occurred during comparison.");
    }
  }

  const handleMerge = async () => {
    if (comparisonStatus !== "can-merge") {
      toast({
        variant: "destructive",
        title: "Cannot Merge",
        description: "Please compare the branches and ensure there are no conflicts.",
      })
      return
    }
    setIsMerging(true);
    await onMerge(repo.fullName, sourceBranch, targetBranch);
    setIsMerging(false);
    onOpenChange(false)
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create and Merge PR in {repo.name}</DialogTitle>
          <DialogDescription>
            Compare branches and then create and automatically merge a pull request.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source-branch">Source Branch</Label>
              <Select value={sourceBranch} onValueChange={setSourceBranch}>
                <SelectTrigger id="source-branch">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {(repo.branches || []).map((branch) => (
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
                  {(repo.branches || []).map((branch) => (
                    <SelectItem key={branch} value={branch} disabled={branch === sourceBranch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {comparisonStatus === "can-merge" && (
            <div className="p-3 rounded-md bg-accent/20 text-accent-foreground border border-accent/50 flex items-center gap-2 text-sm">
                <CheckCircle className="size-4 text-accent" />
                <p>Branches can be merged cleanly.</p>
            </div>
          )}

          {comparisonStatus === "has-conflicts" && (
             <div className="p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4" />
                <p>{comparisonError || "Merge conflicts detected. Please resolve them manually."}</p>
            </div>
          )}

          {comparisonStatus === "no-changes" && (
            <div className="p-3 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 flex items-center gap-2 text-sm">
                <Info className="size-4" />
                <p>No changes detected between the selected branches.</p>
            </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {comparisonStatus !== "can-merge" ? (
            <Button onClick={handleCompare} disabled={comparisonStatus === 'comparing' || !sourceBranch || !targetBranch}>
              {comparisonStatus === 'comparing' ? <Loader className="mr-2 size-4 animate-spin" /> : <GitPullRequest className="mr-2 size-4" />}
              {comparisonStatus === 'comparing' ? 'Comparing...' : 'Compare Branches'}
            </Button>
          ) : (
            <Button onClick={handleMerge} disabled={isMerging} className="bg-accent hover:bg-accent/90">
              {isMerging ? <Loader className="mr-2 size-4 animate-spin" /> : <GitMerge className="mr-2 size-4" />}
              {isMerging ? 'Merging...' : 'Create and Merge PR'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
