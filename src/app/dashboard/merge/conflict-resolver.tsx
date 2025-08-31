"use client"

import { useState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, GitMerge, Loader2 } from 'lucide-react';
import { getFileContent, getFileDiff } from '../repositories/actions';
import { type PullRequest } from '@/lib/store';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

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

function DiffViewer({ diff, pr }: { diff: string, pr: PullRequest }) {
    const lines = diff.split('\n');

    return (
        <div className="font-mono text-xs p-4 rounded-md bg-muted/50 border max-h-96 overflow-y-auto">
            <div className="flex text-muted-foreground mb-2">
                <div className="w-10 text-center">+/-</div>
                <div className="flex-1">Content</div>
            </div>
            {lines.slice(4).map((line, index) => {
                let colorClass = '';
                let symbol = ' ';
                if (line.startsWith('+')) {
                    colorClass = 'bg-green-500/10 text-green-700 dark:text-green-400';
                    symbol = '+';
                } else if (line.startsWith('-')) {
                    colorClass = 'bg-red-500/10 text-red-700 dark:text-red-400';
                    symbol = '-';
                } else if (line.startsWith('@@')) {
                    colorClass = 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
                }

                return (
                    <div key={index} className={`flex ${colorClass}`}>
                        <div className={`w-10 text-center select-none text-muted-foreground/50`}>
                            {symbol}
                        </div>
                        <pre className="flex-1 whitespace-pre-wrap">{line.substring(1)}</pre>
                    </div>
                );
            })}
        </div>
    )
}

interface ConflictResolverProps {
    repoFullName: string;
    prNumber: number;
    filePath: string;
    pr: PullRequest;
}

export default function ConflictResolver({ repoFullName, prNumber, filePath, pr }: ConflictResolverProps) {
  const [diffContent, setDiffContent] = useState('');
  const [resolvedContent, setResolvedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (repoFullName && pr.sourceBranch && pr.targetBranch && filePath) {
      setLoading(true);
      
      Promise.all([
          getFileDiff(repoFullName, pr.targetBranch, pr.sourceBranch, filePath),
          getFileContent(repoFullName, pr.sourceBranch, filePath) // fetch source for initial textarea content
      ]).then(([diff, sourceFile]) => {
          setDiffContent(diff);
          setResolvedContent(sourceFile.content);
      }).catch((err) => {
        console.error("Error fetching file contents:", err);
        setError("Could not load file content or diff. You may need to fetch it manually. " + err.message);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [repoFullName, pr, filePath]);


  if (loading) return (
      <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-6 w-1/4 mt-4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64 w-full" />
      </CardContent>
  );

  return (
      <>
          <input type="hidden" name="repoFullName" value={repoFullName} />
          <input type="hidden" name="pullRequestNumber" value={prNumber} />
          <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
          <input type="hidden" name="filePath" value={filePath} />
          <input type="hidden" name="resolvedContent" value={resolvedContent} />

          <CardContent className="space-y-8 p-0">
              {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error loading file content</AlertTitle>
                    <AlertDescription>
                        {error}
                         <Button asChild variant="link" className="p-0 h-auto ml-1">
                             <Link href={`${pr.url}/files`} target="_blank">View Diffs on GitHub</Link>
                         </Button>
                    </AlertDescription>
                </Alert>
              )}
              
              {!error && (
                <>
                    <div>
                        <Label>Changes between <Badge variant="secondary">{pr.targetBranch}</Badge> and <Badge variant="secondary">{pr.sourceBranch}</Badge></Label>
                        <CardDescription className="mt-1">
                            Review the additions (+) and deletions (-) below.
                        </CardDescription>
                        <DiffViewer diff={diffContent} pr={pr} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="resolvedContent">Resolved Code</Label>
                        <CardDescription>
                           Edit the code below to resolve the conflict. The final content should be what you want to commit to the <span className="font-bold">{pr.sourceBranch}</span> branch.
                        </CardDescription>
                        <div className="flex w-full rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                            <Textarea
                                id="resolvedContent"
                                name="resolvedContent"
                                rows={20}
                                className="font-mono flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                style={{ lineHeight: '1.75rem' }}
                                placeholder="Resolve the conflict here."
                                value={resolvedContent}
                                onChange={(e) => setResolvedContent(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>
                </>
              )}

          </CardContent>

          <CardFooter className="p-0 pt-8 flex justify-end">
            <SubmitButton />
          </CardFooter>
      </>
  );
}
