
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GitMerge, Loader2, Wand2, CheckCircle } from 'lucide-react';
import { type PullRequest } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DiffEditor } from '@monaco-editor/react';
import { Skeleton } from '@/components/ui/skeleton';
import { intelligentConflictResolution } from '@/ai/flows/intelligent-conflict-resolution';
import { useToast } from '@/hooks/use-toast';
import { resolveConflictFile } from './actions';

function getMonacoLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'py':
            return 'python';
        case 'java':
            return 'java';
        case 'c':
        case 'cpp':
        case 'h':
            return 'csharp';
        case 'json':
            return 'json';
        case 'html':
            return 'html';
        case 'css':
            return 'css';
        case 'scss':
            return 'scss';
        case 'md':
            return 'markdown';
        case 'yaml':
        case 'yml':
            return 'yaml';
        default:
            return 'plaintext';
    }
}

function MarkAsResolvedButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
       {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Committing...
        </>
      ) : (
        <>
          Mark as Resolved
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
    onResolved: () => void;
}

export default function ConflictResolver({ pr, filePath, sourceContent, targetContent, onResolved }: ConflictResolverProps) {
    const [resolvedContent, setResolvedContent] = useState('');
    const [isAiResolving, setIsAiResolving] = useState(false);
    const [isMarkedAsResolved, setIsMarkedAsResolved] = useState(false);
    const { toast } = useToast();

    const initialContent = useMemo(() => {
        return `<<<<<<< ${pr.targetBranch}\n${targetContent}\n=======\n${sourceContent}\n>>>>>>> ${pr.sourceBranch}`;
    }, [targetContent, sourceContent, pr.targetBranch, pr.sourceBranch]);

    const [state, formAction] = useFormState(resolveConflictFile, { success: false, message: '' });

    useEffect(() => {
        setResolvedContent(initialContent);
    }, [initialContent]);

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({ title: "Success", description: state.message });
                setIsMarkedAsResolved(true);
                onResolved();
            } else {
                toast({ variant: "destructive", title: "Error", description: state.message });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.message]);


    const acceptTarget = () => {
        setResolvedContent(targetContent);
    }
    
    const acceptSource = () => {
        setResolvedContent(sourceContent);
    }

    const handleAiSuggestion = async () => {
        setIsAiResolving(true);
        toast({ title: 'AI Thinking...', description: 'Generating a suggested resolution for the conflict.' });
        try {
            const result = await intelligentConflictResolution({ fileDiff: initialContent });
            setResolvedContent(result.suggestedResolution);
            toast({ title: 'AI Suggestion Applied', description: 'The AI-generated resolution has been applied. Please review and commit.' });
        } catch (error: any) {
            console.error("AI suggestion failed:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast({ variant: 'destructive', title: 'AI Suggestion Failed', description: errorMessage || 'An unknown error occurred.' });
        } finally {
            setIsAiResolving(false);
        }
    }

    return (
      <form action={formAction}>
        <div className="space-y-4">
            <input type="hidden" name="repoFullName" value={pr.repoFullName} />
            <input type="hidden" name="pullRequestNumber" value={pr.number} />
            <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
            <input type="hidden" name="filePath" value={filePath} />
            
            <div className="grid grid-cols-2 gap-4 text-center text-sm font-medium">
                <Label>Current change from <Badge variant="secondary">{pr.targetBranch}</Badge></Label>
                <Label>Incoming change from <Badge variant="secondary">{pr.sourceBranch}</Badge></Label>
            </div>
             <div className="border rounded-md h-[50vh] overflow-hidden">
                 <DiffEditor
                    height="50vh"
                    original={targetContent}
                    modified={sourceContent}
                    language={getMonacoLanguage(filePath)}
                    theme="vs-dark"
                    loading={<Skeleton className="h-full w-full" />}
                 />
            </div>
            
            <div className="space-y-2">
                <Label className="font-bold text-base">Resolution</Label>
                <p className="text-sm text-muted-foreground">
                    Use the buttons to accept a version, get an AI suggestion, or manually edit the code below to resolve the conflict. When ready, mark it as resolved.
                </p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={acceptTarget} disabled={isMarkedAsResolved}>Accept Current</Button>
                    <Button type="button" variant="outline" onClick={acceptSource} disabled={isMarkedAsResolved}>Accept Incoming</Button>
                    <Button type="button" variant="outline" onClick={handleAiSuggestion} disabled={isAiResolving || isMarkedAsResolved}>
                        {isAiResolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {isAiResolving ? 'Generating...' : 'AI Suggestion'}
                    </Button>
                </div>
                <Textarea
                    name="resolvedContent"
                    value={resolvedContent}
                    onChange={(e) => setResolvedContent(e.target.value)}
                    className="font-mono text-sm resize-y"
                    rows={15}
                    disabled={isMarkedAsResolved}
                />
            </div>
             <div className="flex justify-end items-center gap-4 pt-6">
                {!isMarkedAsResolved ? (
                    <MarkAsResolvedButton />
                ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-accent">
                        <CheckCircle className="size-5" />
                        <span>File conflict resolved. You can now merge the pull request.</span>
                    </div>
                )}
            </div>
        </div>
      </form>
  );
}
