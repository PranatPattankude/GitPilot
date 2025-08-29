
"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { GitMerge, Loader2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { resolveConflictAndMerge } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { type PullRequest } from "@/lib/store"

interface ConflictResolverProps {
  pr: PullRequest
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      {pending ? "Committing & Merging..." : "Commit Fix and Merge Pull Request"}
      <GitMerge className="ml-2 size-4" />
    </Button>
  )
}

export default function ConflictResolver({ pr }: ConflictResolverProps) {
  const [state, formAction] = useFormState(resolveConflictAndMerge, { success: false, message: null })
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast({ title: "Conflict Resolved!", description: "The pull request was successfully merged." })
    } else if (state.message) {
      toast({ variant: "destructive", title: "Error", description: state.message })
    }
  }, [state, toast])

  return (
    <Card className="bg-background/50 border-0 shadow-none">
      <form action={formAction}>
        {/* Hidden inputs to pass PR info to the server action */}
        <input type="hidden" name="repoFullName" value={pr.repoFullName} />
        <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
        <input type="hidden" name="pullRequestNumber" value={pr.number} />

        <CardContent className="space-y-6 p-0">
          <CardDescription>
            This tool helps you resolve a single file conflict at a time.
            Follow the steps below.
          </CardDescription>

          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Step 1: Provide File Details</h3>
            <p className="text-sm text-muted-foreground">
              Enter the full path of the file that has the conflict (e.g., `src/components/ui/button.tsx`). You can find this on the GitHub pull request page under the "Files changed" tab.
            </p>
            <div className="space-y-2">
              <Label htmlFor="file-path">Conflicting File Path</Label>
              <Input
                id="file-path"
                name="filePath"
                placeholder="e.g., src/app/page.tsx"
                className="font-mono"
                required
              />
            </div>
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg">
             <h3 className="font-semibold text-lg">Step 2: Resolve the Conflict</h3>
            <p className="text-sm text-muted-foreground">
                Go to the conflicting file on GitHub or in your local editor. Copy the <span className="font-bold">entire file content</span>, including the conflict markers (`&lt;&lt;&lt;&lt;&lt;&lt;&lt;`, `=======`, `&gt;&gt;&gt;&gt;&gt;&gt;&gt;`), and paste it into the editor below. Then, manually resolve the conflicts by editing the text.
            </p>
            <div className="space-y-2">
              <Label htmlFor="resolved-content">Resolved File Content</Label>
              <Textarea
                id="resolved-content"
                name="resolvedContent"
                rows={20}
                className="font-mono"
                placeholder="Paste the entire file content here, then edit it to resolve the conflicts."
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end items-center p-0 pt-6">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  )
}
