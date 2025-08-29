
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
import { GitMerge, GitPullRequest, CheckCircle, AlertTriangle } from "lucide-react"

interface MergeDialogProps {
  repo: Repository
  onOpenChange: (open: boolean) => void
  onMerge: (repoId: string, sourceBranch: string, targetBranch: string) => void
}

type ComparisonStatus = "idle" | "comparing" | "can-merge" | "has-conflicts"

export function MergeDialog({ repo, onOpenChange, onMerge }: MergeDialogProps) {
  const [sourceBranch, setSourceBranch] = useState("")
  const [targetBranch, setTargetBranch] = useState(repo.branches?.includes('main') ? 'main' : repo.branches?.[0] || "")
  const [comparisonStatus, setComparisonStatus] = useState<ComparisonStatus>("idle")
  const { toast } = useToast()

  useEffect(() => {
    // Reset comparison status if branches change
    setComparisonStatus("idle")
  }, [sourceBranch, targetBranch])

  const handleCompare = () => {
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
    // Simulate API call
    setTimeout(() => {
      // In a real app, you'd check for conflicts here.
      // We'll simulate a clean merge for now.
      setComparisonStatus("can-merge")
      toast({
        title: "Branches Can Be Merged",
        description: "No conflicts were found between the selected branches.",
      })
    }, 1500)
  }

  const handleMerge = () => {
    if (comparisonStatus !== "can-merge") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please compare the branches before merging.",
      })
      return
    }
    onMerge(repo.id, sourceBranch, targetBranch)
    onOpenChange(false)
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Branches in {repo.name}</DialogTitle>
          <DialogDescription>
            Select and compare branches to initiate a merge.
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
                <p>Merge conflicts detected. Please resolve them manually.</p>
            </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {comparisonStatus !== "can-merge" ? (
            <Button onClick={handleCompare} disabled={comparisonStatus === 'comparing' || !sourceBranch || !targetBranch}>
              <GitPullRequest className="mr-2 size-4" />
              {comparisonStatus === 'comparing' ? 'Comparing...' : 'Compare Branches'}
            </Button>
          ) : (
            <Button onClick={handleMerge} className="bg-accent hover:bg-accent/90">
              <GitMerge className="mr-2 size-4" />
              Initiate Merge
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
