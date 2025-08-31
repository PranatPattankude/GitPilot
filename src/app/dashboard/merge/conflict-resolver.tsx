"use client"

import { useState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { GitMerge, Loader2, Wand2 } from 'lucide-react';
import { type PullRequest } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DiffEditor } from '@monaco-editor/react';
import { Skeleton } from '@/components/ui/skeleton';
import { intelligentConflictResolution } from '@/ai/flows/intelligent-conflict-resolution';
import { useToast } from '@/hooks/use-toast';

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
    const [resolvedContent, setResolvedContent] = useState('');
    const [isAiResolving, setIsAiResolving] = useState(false);
    const editorRef = useRef<any>(null);
    const { toast } = useToast();

    const initialContent = useMemo(() => {
        return `<<<<<<< ${pr.targetBranch}\n${targetContent}\n=======\n${sourceContent}\n>>>>>>> ${pr.sourceBranch}`;
    }, [targetContent, sourceContent, pr.targetBranch, pr.sourceBranch]);

    useEffect(() => {
        setResolvedContent(initialContent);
    }, [initialContent]);

    function handleEditorDidMount(editor: any) {
        editorRef.current = editor;
    }
    
    function handleEditorChange(value: string | undefined) {
        setResolvedContent(value || '');
    }

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
            toast({ variant: 'destructive', title: 'AI Suggestion Failed', description: error.message || 'An unknown error occurred.' });
        } finally {
            setIsAiResolving(false);
        }
    }

    return (
      <>
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
                    language="typescript" // You can make this dynamic based on file extension
                    theme="vs-dark"
                    loading={<Skeleton className="h-full w-full" />}
                 />
            </div>
            
            <div className="space-y-2">
                <Label className="font-bold text-base">Resolution</Label>
                <p className="text-sm text-muted-foreground">
                    Use the buttons to accept a version, get an AI suggestion, or manually edit the code below to resolve the conflict. The final content will be committed.
                </p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={acceptTarget}>Accept Current</Button>
                    <Button type="button" variant="outline" onClick={acceptSource}>Accept Incoming</Button>
                    <Button type="button" variant="outline" onClick={handleAiSuggestion} disabled={isAiResolving}>
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
                />
            </div>
        </div>
        
        <CardFooter className="p-0 pt-6 flex justify-end">
           <SubmitButton />
        </CardFooter>
      </>
  );
}
