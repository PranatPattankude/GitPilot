
"use client"

import { useState, useLayoutEffect, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { GitMerge, Loader2, Check, Wand2 } from 'lucide-react';
import { type PullRequest } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types for parsed conflict blocks
type CodeLine = { type: 'code'; line: string; lineNumber: number };
type ConflictBlock = {
  type: 'conflict';
  id: number;
  header: string;
  current: string[];
  incoming: string[];
  footer: string;
  resolution: 'current' | 'incoming' | 'both' | 'none' | 'manual';
  manualContent?: string;
};
type ParsedBlock = CodeLine | ConflictBlock;


function parseConflict(fileContent: string): ParsedBlock[] {
  const lines = fileContent.split('\n');
  const blocks: ParsedBlock[] = [];
  let inConflict = false;
  let currentBlock: Partial<ConflictBlock> = {};
  let conflictId = 0;
  let lineNumber = 1;

  for (const line of lines) {
    if (line.startsWith('<<<<<<<')) {
      inConflict = true;
      currentBlock = {
        type: 'conflict',
        id: conflictId++,
        header: line,
        current: [],
        incoming: [],
        resolution: 'none',
      };
    } else if (line.startsWith('=======')) {
      // Switch from current to incoming
    } else if (line.startsWith('>>>>>>>')) {
      currentBlock.footer = line;
      blocks.push(currentBlock as ConflictBlock);
      inConflict = false;
      currentBlock = {};
    } else if (inConflict) {
      if (currentBlock.footer === undefined) { // Before '======='
        currentBlock.current!.push(line);
      } else { // After '======='
        currentBlock.incoming!.push(line);
      }
    } else {
      blocks.push({ type: 'code', line, lineNumber });
      lineNumber++;
    }
  }
  return blocks;
}

// Re-assembles the file content based on resolutions
function reassembleFile(blocks: ParsedBlock[]): string {
    return blocks.map(block => {
        if (block.type === 'code') {
            return block.line;
        }
        if (block.type === 'conflict') {
            switch (block.resolution) {
                case 'current':
                    return block.current.join('\n');
                case 'incoming':
                    return block.incoming.join('\n');
                case 'both':
                    return [...block.current, ...block.incoming].join('\n');
                case 'manual':
                     return block.manualContent || '';
                default:
                    // If unresolved, keep markers for validation
                    return [block.header, ...block.current, '=======', ...block.incoming, block.footer].join('\n');
            }
        }
        return '';
    }).join('\n');
}

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
    const [blocks, setBlocks] = useState<ParsedBlock[]>([]);

    useLayoutEffect(() => {
        setBlocks(parseConflict(initialContent));
    }, [initialContent]);

    const resolvedContent = useMemo(() => reassembleFile(blocks), [blocks]);

    const handleResolve = (conflictId: number, resolution: 'current' | 'incoming' | 'both') => {
        setBlocks(prevBlocks => prevBlocks.map(block => {
            if (block.type === 'conflict' && block.id === conflictId) {
                return { ...block, resolution };
            }
            return block;
        }));
    };
    
    const allResolved = useMemo(() => blocks.every(b => b.type === 'code' || b.resolution !== 'none'), [blocks]);

  return (
      <>
          <input type="hidden" name="repoFullName" value={pr.repoFullName} />
          <input type="hidden" name="pullRequestNumber" value={pr.number} />
          <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
          <input type="hidden" name="filePath" value={filePath} />
          <input type="hidden" name="resolvedContent" value={resolvedContent} />

          <div className="space-y-6">
            <div>
                <Label>Changes between <Badge variant="secondary">{pr.targetBranch}</Badge> and <Badge variant="secondary">{pr.sourceBranch}</Badge></Label>
                <DiffViewer diff={diff} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="resolvedContent">Resolve Conflicts</Label>
                 <p className="text-sm text-muted-foreground">
                    For each conflict block, choose which version to keep. The final resolved code will be committed to <Badge variant="secondary">{pr.sourceBranch}</Badge>.
                </p>
                <div className="w-full rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 font-mono text-sm">
                    <ScrollArea className="h-[400px]">
                        <div className="p-4">
                            {blocks.map((block, index) => {
                                if (block.type === 'code') {
                                    return <pre key={index} className="whitespace-pre-wrap">{block.line}</pre>
                                }
                                
                                const isResolved = block.resolution !== 'none';

                                return (
                                    <div key={block.id} className={cn("my-2 border rounded-md overflow-hidden", isResolved && "border-green-500/50 bg-green-500/5")}>
                                       <div className="flex justify-between items-center text-xs p-2 bg-muted/50 border-b">
                                            <span className="font-sans text-muted-foreground">Conflict #{block.id + 1}</span>
                                            {isResolved ? (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <Check className="size-4" />
                                                    <span>Resolved as <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">{block.resolution}</Badge></span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleResolve(block.id, 'current')}>Accept Current</Button>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleResolve(block.id, 'incoming')}>Accept Incoming</Button>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleResolve(block.id, 'both')}>Accept Both</Button>
                                                </div>
                                            )}
                                        </div>
                                       
                                       {isResolved ? (
                                           <div className="p-2 bg-background">
                                                <pre className="whitespace-pre-wrap text-muted-foreground">
                                                    {reassembleFile([block])}
                                                </pre>
                                           </div>
                                       ) : (
                                            <>
                                                <div className="p-2 bg-blue-500/10">
                                                    <div className="flex items-center justify-between pb-1">
                                                        <Badge variant="outline" className="border-blue-400/50 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Current Change</Badge>
                                                    </div>
                                                    <pre className="whitespace-pre-wrap text-blue-800 dark:text-blue-300">{block.current.join('\n')}</pre>
                                                </div>
                                                <div className="p-2 bg-purple-500/10">
                                                     <div className="flex items-center justify-between pb-1">
                                                        <Badge variant="outline" className="border-purple-400/50 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">Incoming Change</Badge>
                                                    </div>
                                                    <pre className="whitespace-pre-wrap text-purple-800 dark:text-purple-300">{block.incoming.join('\n')}</pre>
                                                </div>
                                            </>
                                       )}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>
          </div>
          
          <CardFooter className="p-0 pt-6 flex justify-end">
            <SubmitButton />
          </CardFooter>
      </>
  );
}
