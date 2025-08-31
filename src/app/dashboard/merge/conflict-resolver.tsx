
"use client"

import { useState, useRef, useLayoutEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { GitMerge, Loader2 } from 'lucide-react';
import { type PullRequest } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


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
        <ScrollArea className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto max-h-80">
            <div className="whitespace-pre-wrap">
                {diff.split('\n').slice(4).map((line, i) => (
                    <div
                    key={i}
                    className={cn(
                        line.startsWith('+') && 'bg-green-600/10',
                        line.startsWith('-') && 'bg-red-600/10'
                    )}
                    >
                        <span className={cn(
                            "inline-block w-8 select-none text-center",
                            line.startsWith('+') && 'text-green-600',
                            line.startsWith('-') && 'text-red-600',
                            !line.startsWith('+') && !line.startsWith('-') && 'text-muted-foreground'
                        )}>
                            {line.startsWith('+') ? '+' : line.startsWith('-') ? ' ' : ' '}
                        </span>
                        <span className="inline pr-4">
                            {line.startsWith('-') ? '-' : ' '}
                        </span>
                        <span className="inline-block whitespace-pre-wrap">
                            {line.substring(1)}
                        </span>
                    </div>
                ))}
            </div>
        </ScrollArea>
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
    const [lineCount, setLineCount] = useState(initialContent.split('\n').length);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const count = resolvedContent.split('\n').length;
        setLineCount(count);
    }, [resolvedContent]);

    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };


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
                <div className="flex w-full rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[300px]">
                    <div 
                        ref={lineNumbersRef}
                        className="line-numbers text-right select-none text-muted-foreground p-2 pr-4 font-mono bg-muted overflow-y-hidden"
                    >
                        {Array.from({ length: lineCount }, (_, i) => (
                            <div key={i}>{i + 1}</div>
                        ))}
                    </div>
                    <Textarea
                        ref={textareaRef}
                        id="resolvedContent"
                        name="resolvedContent"
                        value={resolvedContent}
                        onChange={(e) => setResolvedContent(e.target.value)}
                        onScroll={handleScroll}
                        className="min-h-full font-mono flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        required
                        spellCheck="false"
                    />
                </div>
            </div>
          </div>
          
          <CardFooter className="p-0 pt-6 flex justify-end">
            <SubmitButton />
          </CardFooter>
      </>
  );
}
