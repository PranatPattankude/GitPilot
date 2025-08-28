"use client"

import { useState } from "react"
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
import { GitMerge } from "lucide-react"

interface MergeDialogProps {
  repo: Repository
  onOpenChange: (open: boolean) => void
  onMerge: (repoId: string, sourceBranch: string, targetBranch: string) => void
}

// Statically defined branches for demonstration purposes.
const availableBranches = ["main", "develop", "feature/new-auth", "fix/caching-issue", "hotfix/prod-login", "dev-k8s", "MSRMH-TRN", "qa-k8s", "KPMC-UAT", "perf-k8s", "Selgate-SIT", "Sriphat-SIT", "UCSI-UAT", "HUMS-DEV"]

export function MergeDialog({ repo, onOpenChange, onMerge }: MergeDialogProps) {
  const [sourceBranch, setSourceBranch] = useState("")
  const [targetBranch, setTargetBranch] = useState("main")
  const { toast } = useToast()

  const handleMerge = () => {
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

    onMerge(repo.id, sourceBranch, targetBranch)
    onOpenChange(false)
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Branches in {repo.name}</DialogTitle>
          <DialogDescription>
            Select the source and target branches to initiate a merge.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source-branch">Source Branch</Label>
            <Select value={sourceBranch} onValueChange={setSourceBranch}>
              <SelectTrigger id="source-branch">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {(repo.branches || availableBranches).map((branch) => (
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
                {(repo.branches || availableBranches).map((branch) => (
                  <SelectItem key={branch} value={branch} disabled={branch === sourceBranch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMerge}>
            <GitMerge className="mr-2 size-4" />
            Initiate Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
