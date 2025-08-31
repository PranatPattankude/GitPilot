"use client"

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { GitMerge, Loader2 } from 'lucide-react';
import { type PullRequest } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DiffEditor } from '@monaco-editor/react';
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

interface ConflictResolverProps {
    pr: PullRequest;
    filePath: string;
    sourceContent: string;
    targetContent: string;
}

export default function ConflictResolver({ pr, filePath, sourceContent, targetContent }: ConflictResolverProps) {
    const [resolvedContent, setResolvedContent] = useState(
        `<<<<<<< ${pr.targetBranch}\n${targetContent}\n=======\n${sourceContent}\n>>>>>>> ${pr.sourceBranch}`
    );

    function getFileLanguage(filePath: string) {
        const extension = filePath.split('.').pop();
        switch (extension) {
            case 'js':
            case 'jsx':
                return 'javascript';
            case 'ts':
            case 'tsx':
                return 'typescript';
            case 'json':
                return 'json';
            case 'css':
                return 'css';
            case 'html':
                return 'html';
            case 'md':
                return 'markdown';
            default:
                return 'plaintext';
        }
    }

  return (
      <>
          <input type="hidden" name="repoFullName" value={pr.repoFullName} />
          <input type="hidden" name="pullRequestNumber" value={pr.number} />
          <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
          <input type="hidden" name="filePath" value={filePath} />
          <input type="hidden" name="resolvedContent" value={resolvedContent} />

          <div className="space-y-6">
             <div>
                <Label>Changes between <Badge variant="secondary">{pr.targetBranch}</Badge> (left) and <Badge variant="secondary">{pr.sourceBranch}</Badge> (right)</Label>
                 <div className="border rounded-md overflow-hidden mt-2">
                    <DiffEditor
                        height="50vh"
                        language={getFileLanguage(filePath)}
                        original={targetContent}
                        modified={sourceContent}
                        theme="vs-dark"
                         loading={<Skeleton className="h-full w-full" />}
                        options={{
                            readOnly: true,
                            renderSideBySide: true,
                            minimap: { enabled: false }
                        }}
                    />
                 </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="resolvedContent">Final Resolved Code</Label>
                 <p className="text-sm text-muted-foreground">
                    Manually resolve any conflicts from the diff viewer above and place the final, correct code here. This content will be committed to <Badge variant="secondary">{pr.sourceBranch}</Badge>.
                </p>
                 <Textarea
                    id="resolvedContent"
                    name="resolvedContent"
                    value={resolvedContent}
                    onChange={(e) => setResolvedContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm border rounded-md"
                    placeholder="// Your final resolved code goes here"
                 />
            </div>
          </div>
          
          <CardFooter className="p-0 pt-6 flex justify-end">
             <SubmitButton />
          </CardFooter>
      </>
  );
}
