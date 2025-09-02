
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import type { Repository } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RebuildDialogProps {
  repo: Repository
  onOpenChange: (open: boolean) => void
  onRebuild: (repoId: string, branch: string) => void
}

export function RebuildDialog({ repo, onOpenChange, onRebuild }: RebuildDialogProps) {
  const [selectedBranch, setSelectedBranch] = useState(repo.branches?.includes('main') ? 'main' : repo.branches?.[0] || "")
  const { toast } = useToast()
  const [popoverOpen, setPopoverOpen] = useState(false)

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
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between"
                  id="branch-select"
                >
                  {selectedBranch
                    ? selectedBranch
                    : "Select a branch"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search branch..." />
                  <CommandEmpty>No branch found.</CommandEmpty>
                  <ScrollArea className="h-48">
                    <CommandList>
                      <CommandGroup>
                        {(repo.branches || []).map((branch) => (
                          <CommandItem
                            key={branch}
                            value={branch}
                            onSelect={() => {
                              setSelectedBranch(branch === selectedBranch ? "" : branch)
                              setPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedBranch === branch ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {branch}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
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
