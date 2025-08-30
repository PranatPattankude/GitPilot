
"use client"

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, GitMerge, Loader2 } from 'lucide-react';
import { intelligentConflictResolution } from '@/ai/flows/intelligent-conflict-resolution';
import { getPullRequestDiff } from '../repositories/actions';
import { resolveConflict } from './actions';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resolving...
        </>
      ) : (
        <>
          Resolve with AI Assistant <GitMerge className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

interface ConflictResolverProps {
    repoFullName: string;
    prNumber: number;
    filePath: string;
}

export default function ConflictResolver({ repoFullName, prNumber, filePath }: ConflictResolverProps) {
  const [diff, setDiff] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [unseenLines, setUnseenLines] = useState('');
  const { toast } = useToast();

  const [state, formAction] = useFormState(resolveConflict, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Conflict Resolved", description: state.message });
      } else {
        toast({ variant: "destructive", title: "Error", description: state.message });
      }
    }
  }, [state, toast]);


  useEffect(() => {
    if (repoFullName && prNumber) {
      setLoading(true);
      getPullRequestDiff(repoFullName, prNumber)
        .then(setDiff)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [repoFullName, prNumber]);


  if (loading) return <Card><CardContent className="p-6"><p>Loading diff...</p></CardContent></Card>;
  if (error) return (
      <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error loading diff</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
      </Card>
  );

  return (
      <Card className="bg-background/50 border-0 shadow-none">
          <form action={formAction}>
              <input type="hidden" name="repoFullName" value={repoFullName} />
              <input type="hidden" name="pullRequestNumber" value={prNumber} />
              <input type="hidden" name="filePath" value={filePath} />
              <input type="hidden" name="fileDiff" value={diff} />

              <CardContent className="space-y-6 p-0">
                  <div className="space-y-2">
                      <Label htmlFor="diff-content">File Diff with Conflicts</Label>
                      <CardDescription>
                          This is the raw diff from the pull request. Use this as a reference.
                      </CardDescription>
                      <Textarea
                          id="diff-content"
                          name="diffDisplay"
                          rows={10}
                          className="font-mono"
                          defaultValue={diff}
                          disabled
                      />
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="suggestion">Your Resolution (Suggestion)</Label>
                       <CardDescription>
                          Based on the diff above, provide the *final, correct* code for the conflicting section. Do not include conflict markers.
                      </CardDescription>
                      <Textarea
                          id="suggestion"
                          name="selectedSuggestion"
                          rows={10}
                          className="font-mono"
                          placeholder="Paste the resolved code here."
                          required
                      />
                  </div>

                   <div className="space-y-2">
                      <Label htmlFor="unseen-lines">Unseen Lines (Optional)</Label>
                      <CardDescription>
                         Paste the *entire content* of the original file here. The AI will use this to find and apply your fix to other similar lines in the file, if any exist.
                      </CardDescription>
                      <Textarea
                          id="unseen-lines"
                          name="unseenLines"
                          rows={15}
                          className="font-mono"
                          placeholder="Paste the full original file content here to enable smart, file-wide conflict resolution."
                      />
                  </div>
              </CardContent>

              <CardFooter className="p-0 pt-6">
                <div className="flex justify-end items-center">
                  <SubmitButton />
                </div>
              </CardFooter>
          </form>
      </Card>
  );
}
