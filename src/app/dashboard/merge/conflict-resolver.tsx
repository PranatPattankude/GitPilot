"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Wand2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveConflict } from "./actions"
import { useToast } from "@/hooks/use-toast"

const initialFileDiff = `<<<<<<< HEAD
import { PrimaryButton } from './components/Buttons';
=======
import { MainButton } from './components/Buttons';
>>>>>>> feature/new-buttons

const App = () => (
  <div>
<<<<<<< HEAD
    <PrimaryButton />
=======
    <MainButton />
>>>>>>> feature/new-buttons
  </div>
);`

const initialUnseenLines = `import { SecondaryButton } from './components/Buttons';
// ... other code ...
<SecondaryButton />`

const initialSuggestion = `import { PrimaryButton as MainButton } from './components/Buttons';

const App = () => (
  <div>
    <MainButton />
  </div>
);`

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Analyzing..." : "Resolve with AI"}
      <Wand2 className="ml-2 size-4" />
    </Button>
  )
}

export default function ConflictResolver() {
  const [state, formAction] = useFormState(resolveConflict, { success: false, data: null, error: null })
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast({ title: "Resolution Suggested", description: "AI has generated an enhanced suggestion." })
    } else if (state.error) {
      toast({ variant: "destructive", title: "Error", description: state.error })
    }
  }, [state, toast])


  return (
    <Card className="bg-background/50">
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Resolve Conflicts</CardTitle>
          <CardDescription>
            Use the editor below to manually resolve, or use AI to suggest a resolution based on your changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-diff">File Diff with Conflicts</Label>
            <Textarea id="file-diff" name="fileDiff" rows={10} defaultValue={initialFileDiff} className="font-mono" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="selected-suggestion">Your Resolution (Suggestion)</Label>
              <Textarea id="selected-suggestion" name="selectedSuggestion" rows={10} defaultValue={initialSuggestion} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unseen-lines">Unseen Lines</Label>
              <Textarea id="unseen-lines" name="unseenLines" rows={10} defaultValue={initialUnseenLines} className="font-mono" />
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
        <CardFooter className="flex justify-between items-center">
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
