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
import { RefreshCw } from "lucide-react"

interface RebuildDialogProps {
  repo: Repository
  onOpenChange: (open: boolean) => void
  onRebuild: (repoId: string, branch: string) => void
}

export function RebuildDialog({ repo, onOpenChange, onRebuild }: RebuildDialogProps) {
  const [selectedBranch, setSelectedBranch] = useState("main")
  const { toast } = useToast()

  const handleRebuildClick = () => {
    if (!selectedBranch) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a branch to rebuild.",
      })
      return
    }

    onRebuild(repo.id, selectedBranch)
    onOpenChange(false)
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rebuild {repo.name}</DialogTitle>
          <DialogDescription>
            Select a branch to trigger a new build for its latest commit.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-select">Branch</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger id="branch-select">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {(repo.branches || []).map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRebuildClick}>
            <RefreshCw className="mr-2 size-4" />
            Rebuild Branch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
