"use client"

import { useState, useRef, useLayoutEffect, useMemo, type RefObject } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { GitMerge, Loader2, Undo2 } from 'lucide-react';
import { type PullRequest } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

type ConflictBlock = {
    id: number;
    type: 'code' | 'conflict';
    line?: string;
    current?: string[];
    incoming?: string[];
    resolution?: 'current' | 'incoming' | 'both' | 'manual';
    manualContent?: string;
};

const parseConflict = (content: string): ConflictBlock[] => {
    const lines = content.split('\n');
    const blocks: ConflictBlock[] = [];
    let inConflict = false;
    let currentBlock: ConflictBlock | null = null;
    let idCounter = 0;

    lines.forEach(line => {
        if (line.startsWith('<<<<<<<')) {
            inConflict = true;
            currentBlock = { id: idCounter++, type: 'conflict', current: [], incoming: [] };
        } else if (line.startsWith('=======')) {
            if (currentBlock && currentBlock.type === 'conflict') {
                inConflict = true; // Still in conflict, but now parsing incoming
            }
        } else if (line.startsWith('>>>>>>>')) {
            if (currentBlock) {
                blocks.push(currentBlock);
            }
            inConflict = false;
            currentBlock = null;
        } else if (inConflict && currentBlock?.type === 'conflict') {
            if (currentBlock.incoming?.length === 0 && !line.startsWith('=======')) {
                currentBlock.current?.push(line);
            } else if (line.startsWith('=======') === false) {
                 currentBlock.incoming?.push(line);
            }
        } else {
            blocks.push({ id: idCounter++, type: 'code', line });
        }
    });

    if (currentBlock) {
        blocks.push(currentBlock);
    }
    return blocks;
};

const reassembleFile = (blocks: ConflictBlock[]): string => {
    return blocks.map(block => {
        if (block.type === 'code') {
            return block.line;
        }
        if (block.resolution === 'manual' && block.manualContent !== undefined) {
            return block.manualContent;
        }
        if (block.resolution === 'current') {
            return block.current?.join('\n');
        }
        if (block.resolution === 'incoming') {
            return block.incoming?.join('\n');
        }
        if (block.resolution === 'both') {
            return [...(block.current || []), ...(block.incoming || [])].join('\n');
        }
        // If unresolved, keep the markers
        return [
            `<<<<<<< HEAD`,
            ...(block.current || []),
            '=======',
            ...(block.incoming || []),
            '>>>>>>>'
        ].join('\n');
    }).join('\n');
};

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
    initialContent: string;
}

export default function ConflictResolver({ pr, filePath, initialContent }: ConflictResolverProps) {
    const [blocks, setBlocks] = useState<ConflictBlock[]>([]);
    const [resolvedContent, setResolvedContent] = useState('');
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const parsed = parseConflict(initialContent);
        setBlocks(parsed);
    }, [initialContent]);

    useLayoutEffect(() => {
        const finalContent = reassembleFile(blocks);
        setResolvedContent(finalContent);
    }, [blocks]);

    const totalLines = useMemo(() => {
        return resolvedContent.split('\n').length;
    }, [resolvedContent]);

    const handleResolve = (blockId: number, resolution: 'current' | 'incoming' | 'both') => {
        setBlocks(prevBlocks =>
            prevBlocks.map(b =>
                b.id === blockId ? { ...b, resolution, manualContent: undefined } : b
            )
        );
    };

    const handleManualChange = (blockId: number, newContent: string) => {
        setBlocks(prevBlocks =>
            prevBlocks.map(b =>
                b.id === blockId ? { ...b, resolution: 'manual', manualContent: newContent } : b
            )
        );
    };
    
     const handleUndo = (blockId: number) => {
        setBlocks(prevBlocks =>
            prevBlocks.map(b =>
                b.id === blockId ? { ...b, resolution: undefined, manualContent: undefined } : b
            )
        );
    };

    const syncScroll = () => {
        if (lineNumbersRef.current && contentRef.current) {
            lineNumbersRef.current.scrollTop = contentRef.current.scrollTop;
        }
    };
    
    return (
      <>
        <input type="hidden" name="repoFullName" value={pr.repoFullName} />
        <input type="hidden" name="pullRequestNumber" value={pr.number} />
        <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
        <input type="hidden" name="filePath" value={filePath} />
        <input type="hidden" name="resolvedContent" value={resolvedContent} />

        <div className="space-y-6">
           <div className="border rounded-md mt-2 flex h-[70vh] overflow-hidden">
                <div ref={lineNumbersRef} className="line-numbers bg-muted text-right select-none text-muted-foreground pr-2 pt-4" style={{ width: '50px' }}>
                     {Array.from({ length: totalLines }, (_, i) => (
                        <div key={i}>{i + 1}</div>
                    ))}
                </div>
                <div ref={contentRef} onScroll={syncScroll} className="flex-1 overflow-y-scroll">
                    <div className="p-4 font-mono text-sm">
                        {blocks.map((block) => (
                             <div key={block.id}>
                                {block.type === 'code' ? (
                                    <pre className="whitespace-pre-wrap">{block.line}</pre>
                                ) : !block.resolution ? (
                                    <div className="border border-yellow-500/50 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 my-2">
                                        <div className="flex gap-2 p-2 border-b border-yellow-500/50">
                                            <Button size="sm" variant="outline" onClick={() => handleResolve(block.id, 'current')}>Accept Current</Button>
                                            <Button size="sm" variant="outline" onClick={() => handleResolve(block.id, 'incoming')}>Accept Incoming</Button>
                                            <Button size="sm" variant="outline" onClick={() => handleResolve(block.id, 'both')}>Accept Both</Button>
                                        </div>
                                        <div className="p-2">
                                            <div className="mb-2">
                                                <Label className="text-xs text-muted-foreground flex items-center gap-2">Current change from <Badge variant="secondary">{pr.targetBranch}</Badge></Label>
                                                <pre className="bg-red-500/10 border border-red-500/30 rounded-md p-2 whitespace-pre-wrap text-sm font-mono mt-1">{block.current?.join('\n')}</pre>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground flex items-center gap-2">Incoming change from <Badge variant="secondary">{pr.sourceBranch}</Badge></Label>
                                                <pre className="bg-green-500/10 border border-green-500/30 rounded-md p-2 whitespace-pre-wrap text-sm font-mono mt-1">{block.incoming?.join('\n')}</pre>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-blue-500/30 bg-blue-50 dark:bg-blue-900/20 rounded-lg my-2">
                                         <div className="flex justify-between items-center p-2 border-b border-blue-500/30">
                                            <Label className="text-xs text-muted-foreground">Resolved as <Badge variant="secondary">{block.resolution}</Badge></Label>
                                            <Button variant="ghost" size="sm" onClick={() => handleUndo(block.id)} className="h-6 gap-1">
                                                <Undo2 className="size-3" /> Undo
                                            </Button>
                                        </div>
                                        <div className="p-2">
                                            <Textarea
                                                value={reassembleFile([block])}
                                                onChange={(e) => handleManualChange(block.id, e.target.value)}
                                                className="font-mono text-sm resize-none"
                                                rows={(block.manualContent?.split('\n').length || reassembleFile([block]).split('\n').length)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        
        <CardFooter className="p-0 pt-6 flex justify-end">
           <SubmitButton />
        </CardFooter>
      </>
  );
}
