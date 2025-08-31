"use client"

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { GitMerge, Loader2 } from 'lucide-react';
import { type PullRequest } from '@/lib/store';
import { Badge } from '@/components/ui/badge';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Committing & Merging...
        </>
      ) : (
        <>
          Commit and Merge <GitMerge className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

function DiffViewer({ diff }: { diff: string }) {
    if (!diff || diff.trim() === "No changes found for this file in the diff.") {
        return (
            <div className="bg-muted p-4 rounded-md font-mono text-sm text-center text-muted-foreground">
                <p>No textual changes detected between branches for this file.</p>
                <p className="text-xs">The conflict might be due to the file being added in both branches.</p>
            </div>
        )
    }
    return (
        <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto max-h-80">
        {diff.split('\n').slice(4).map((line, i) => (
            <div
            key={i}
            className={
                line.startsWith('+')
                ? 'bg-green-600/10'
                : line.startsWith('-')
                ? 'bg-red-600/10'
                : ''
            }
            >
            <span className={`inline-block w-8 select-none text-center ${
                 line.startsWith('+')
                ? 'text-green-600'
                : line.startsWith('-')
                ? 'text-red-600'
                : 'text-muted-foreground'
            }`}>
                {line.startsWith('+') ? '+' : line.startsWith('-') ? '-' : ' '}
            </span>
            <pre className="inline whitespace-pre-wrap">
                {line.startsWith('+') || line.startsWith('-')
                ? line.substring(1)
                : line}
            </pre>
            </div>
        ))}
        </div>
    );
}

interface ConflictResolverProps {
    pr: PullRequest;
    filePath: string;
    diff: string;
    initialContent: string;
}

export default function ConflictResolver({ pr, filePath, diff, initialContent }: ConflictResolverProps) {
  const [resolvedContent, setResolvedContent] = useState(initialContent);

  return (
      <>
          <input type="hidden" name="repoFullName" value={pr.repoFullName} />
          <input type="hidden" name="pullRequestNumber" value={pr.number} />
          <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
          <input type="hidden" name="filePath" value={filePath} />

          <div className="space-y-6">
            <div>
                <Label>Changes between <Badge variant="secondary">{pr.targetBranch}</Badge> and <Badge variant="secondary">{pr.sourceBranch}</Badge></Label>
                <DiffViewer diff={diff} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="resolvedContent">Resolved Code</Label>
                <p className="text-sm text-muted-foreground">
                    Edit the code below to resolve the conflict. This will overwrite the file on the <Badge variant="secondary">{pr.sourceBranch}</Badge> branch.
                </p>
                <Textarea
                    id="resolvedContent"
                    name="resolvedContent"
                    value={resolvedContent}
                    onChange={(e) => setResolvedContent(e.target.value)}
                    className="min-h-[300px] font-mono"
                    required
                />
            </div>
          </div>
          
          <CardFooter className="p-0 pt-6 flex justify-end">
            <SubmitButton />
          </CardFooter>
      </>
  );
}
