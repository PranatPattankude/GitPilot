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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { Repository } from "@/lib/store"

interface EditTagsDialogProps {
  repo: Repository
  onOpenChange: (open: boolean) => void
  onSave: (repoId: string, newTags: string[]) => void
}

export function EditTagsDialog({ repo, onOpenChange, onSave }: EditTagsDialogProps) {
  const [tags, setTags] = useState(repo.tags)
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    setTags(repo.tags)
  }, [repo])

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = () => {
    onSave(repo.id, tags)
    onOpenChange(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tags for {repo.name}</DialogTitle>
          <DialogDescription>
            Add or remove tags to help organize your repositories.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new tag"
            />
            <Button onClick={handleAddTag} variant="outline">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
