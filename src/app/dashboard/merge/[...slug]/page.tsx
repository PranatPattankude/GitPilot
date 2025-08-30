
"use client"

import { useEffect, useState, useMemo } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { getPullRequest } from "../../repositories/actions";
import { type PullRequest } from "@/lib/store";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, GitBranch, ChevronsRight, FileCode, GitMerge, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { resolveConflictAndMerge } from "../actions";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      {pending ? "Committing & Merging..." : "Commit Fix and Merge Pull Request"}
      <GitMerge className="ml-2 size-4" />
    </Button>
  )
}

export default function MergeConflictPage({ params }: { params: { slug: string[] } }) {
    const [pr, setPr] = useState<PullRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [repoFullName, prNumber, filePath] = useMemo(() => {
        if (!params.slug || params.slug.length < 3) {
            return ["", null, ""];
        }
        const [repoOwner, repoName, prNumberStr, ...filePathParts] = params.slug;
        const fullName = `${repoOwner}/${repoName}`;
        const number = parseInt(prNumberStr, 10);
        const path = decodeURIComponent(filePathParts.join('/'));
        return [fullName, number, path];

    }, [params.slug]);

    useEffect(() => {
        if (repoFullName && prNumber) {
            setLoading(true);
            getPullRequest(repoFullName, prNumber)
            .then(setPr)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
        }
    }, [repoFullName, prNumber]);
    
    const { toast } = useToast();
    const [state, formAction] = useFormState(resolveConflictAndMerge, { success: false, message: null });

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({ title: "Conflict Resolved!", description: state.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: state.message });
            }
        }
    }, [state, toast]);

    const header = (
        <header>
            <h1 className="text-3xl font-bold tracking-tight">Resolve Conflict</h1>
            {loading ? (
                <Skeleton className="h-5 w-1/2 mt-1" />
            ) : pr ? (
                 <p className="text-muted-foreground mt-1">
                    For <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PR #{pr.number}: {pr.title}</a> in <span className="font-medium text-foreground">{pr.repoFullName}</span>
                </p>
            ) : (
                <p className="text-muted-foreground mt-1">Loading pull request details...</p>
            )}
        </header>
    );

    if (loading) {
        return (
            <div className="space-y-6">
                {header}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-96 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
         return (
            <div className="space-y-6">
                {header}
                <Card>
                    <CardContent className="py-6">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Failed to load Pull Request</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!pr || !repoFullName || !prNumber || !filePath) {
        return (
            <div className="space-y-6">
                {header}
                <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                        Pull Request not found or file path is missing.
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
         <div className="space-y-6">
            {header}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <GitBranch className="h-4 w-4" />
                                <Badge variant="secondary">{pr.sourceBranch}</Badge>
                                <ChevronsRight className="size-4" />
                                <Badge variant="secondary">{pr.targetBranch}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileCode className="h-4 w-4" />
                                <span className="font-mono">{filePath}</span>
                            </div>
                        </div>
                         <Button asChild variant="outline">
                            <Link href="/dashboard/merge">Back to Conflicts</Link>
                         </Button>
                    </div>
                </CardHeader>
                 <CardContent>
                     <Card className="bg-background/50 border-0 shadow-none">
                        <form action={formAction}>
                            <input type="hidden" name="repoFullName" value={pr.repoFullName} />
                            <input type="hidden" name="sourceBranch" value={pr.sourceBranch} />
                            <input type="hidden" name="pullRequestNumber" value={pr.number} />
                            <input type="hidden" name="filePath" value={filePath} />

                            <CardContent className="space-y-6 p-0">
                                <CardDescription>
                                    To resolve the conflict, paste the entire content of the file (including conflict markers) from your local editor or GitHub into the textarea below. Then, edit the content to fix the conflict, and commit the final version.
                                </CardDescription>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="resolved-content">Resolved File Content for <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{filePath}</span></Label>
                                  <Textarea
                                    id="resolved-content"
                                    name="resolvedContent"
                                    rows={20}
                                    className="font-mono"
                                    placeholder="Paste the entire file content here, then edit it to resolve the conflicts."
                                    required
                                  />
                                </div>
                            </CardContent>
                            <div className="flex justify-end items-center p-0 pt-6">
                              <SubmitButton />
                            </div>
                        </form>
                    </Card>
                </CardContent>
            </Card>
        </div>
    )
}
