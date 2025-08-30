
"use client"

import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, GitMerge, Loader2 } from 'lucide-react';
import { getFileContent } from '../repositories/actions';
import { type PullRequest } from '@/lib/store';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
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

interface ConflictResolverProps {
    repoFullName: string;
    prNumber: number;
    filePath: string;
    pr: PullRequest;
}

export default function ConflictResolver({ repoFullName, prNumber, filePath, pr }: ConflictResolverProps) {
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (repoFullName && pr.sourceBranch && filePath) {
      setLoading(true);
      // We fetch from source and target to show the user both versions
      // This is a simplified approach. A real diff editor would be more complex.
      Promise.all([
        getFileContent(repoFullName, pr.sourceBranch, filePath),
        getFileContent(repoFullName, pr.targetBranch, filePath)
      ]).then(([source, target]) => {
          const combinedContent = `<<<<<<< ${pr.sourceBranch} (Source)\n${source.content}\n=======\n${target.content}\n>>>>>>> ${pr.targetBranch} (Target)`;
          setFileContent(combinedContent);
      }).catch((err) => {
        console.error("Error fetching file contents:", err);
        setError("Could not load file content. You may need to fetch it manually. " + err.message);
        // Provide a link to the file on GitHub as a fallback
        const fileUrl = `${pr.url}/files#diff-${source.sha}`;
        setFileContent(`Error loading file. Please open the file on GitHub to view the conflict and paste the resolved content here.\n\nFile URL: ${fileUrl}`);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [repoFullName, pr, filePath]);


  if (loading) return <CardContent className="p-6"><p>Loading file content...</p></CardContent>;

  return (
      <>
          <input type="hidden" name="repoFullName" value={repoFullName} />
          <input type="hidden" name="pullRequestNumber" value={prNumber} />
          <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
          <input type="hidden" name="filePath" value={filePath} />

          <CardContent className="space-y-6 p-0">
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

              <div className="space-y-2">
                  <Label htmlFor="resolvedContent">Resolve Conflict</Label>
                    <CardDescription>
                        The editor below shows the content from both branches. Edit the code to resolve the conflict, removing the `&lt;&lt;&lt;&lt;&lt;&lt;&lt;`, `=======`, and `&gt;&gt;&gt;&gt;&gt;&gt;&gt;` markers. The final content should be what you want to commit.
                    </CardDescription>
                  <Textarea
                      id="resolvedContent"
                      name="resolvedContent"
                      rows={20}
                      className="font-mono"
                      placeholder="Resolve the conflict here."
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      required
                      disabled={loading || !!error}
                  />
              </div>

          </CardContent>

          <CardFooter className="p-0 pt-6">
            <div className="flex justify-end items-center">
              <SubmitButton />
            </div>
          </CardFooter>
      </>
  );
}
