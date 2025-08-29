
"use client"

import { useEffect, useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Wand2, Loader2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveConflict } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { getPullRequestDiff } from "../repositories/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface ConflictResolverProps {
  repoFullName: string;
  prNumber: number;
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Analyzing..." : "Resolve with AI"}
      <Wand2 className="ml-2 size-4" />
    </Button>
  )
}

export default function ConflictResolver({ repoFullName, prNumber }: ConflictResolverProps) {
  const [state, formAction] = useFormState(resolveConflict, { success: false, data: null, error: null })
  const { toast } = useToast()
  const [diff, setDiff] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiff() {
        if (!repoFullName || !prNumber) return;
        setLoading(true);
        setError(null);
        try {
            const diffText = await getPullRequestDiff(repoFullName, prNumber);
            setDiff(diffText);
        } catch (e: any) {
            setError(e.message || "Failed to fetch pull request diff.");
        } finally {
            setLoading(false);
        }
    }
    fetchDiff();
  }, [repoFullName, prNumber]);

  useEffect(() => {
    if (state.success) {
      toast({ title: "Resolution Suggested", description: "AI has generated an enhanced suggestion." })
    } else if (state.error) {
      toast({ variant: "destructive", title: "Error", description: state.error })
    }
  }, [state, toast])

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    )
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error loading diff</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    )
  }

  return (
    <Card className="bg-background/50 border-0 shadow-none">
      <form action={formAction}>
        {/* Hidden input to pass the diff to the server action */}
        <input type="hidden" name="fileDiff" value={diff || ""} />
        <CardContent className="space-y-4 p-0">
          <div className="space-y-2">
            <Label htmlFor="file-diff">File Diff with Conflicts</Label>
            <Textarea id="file-diff" name="fileDiffDisplay" rows={10} defaultValue={diff || "Could not load diff."} className="font-mono" disabled />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="selected-suggestion">Your Resolution (Suggestion)</Label>
              <Textarea id="selected-suggestion" name="selectedSuggestion" rows={10} placeholder="Manually resolve the conflicts from the diff above and paste the final, correct code here." className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unseen-lines">Unseen Lines</Label>
              <Textarea id="unseen-lines" name="unseenLines" rows={10} placeholder="To use the AI resolution enhancement, paste the rest of the file's content here. The AI will apply your fix to similar lines it finds." className="font-mono" />
            </div>
          </div>
          {state.success && state.data?.enhancedSuggestion && (
            <div className="space-y-2">
              <Label>AI Enhanced Suggestion</Label>
              <pre className="p-4 rounded-md bg-muted text-sm font-mono overflow-x-auto">
                <code>{state.data.enhancedSuggestion}</code>
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center p-0 pt-4">
          <div>
            {state.success && (
              <Button>Confirm and Commit</Button>
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="outline">Save Manual Resolution</Button>
            <SubmitButton />
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
