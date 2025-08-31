"use client"

import { useEffect, useState, useActionState } from "react"
import { getPullRequest, getFileDiff, getFileContent } from "../../repositories/actions";
import { type PullRequest } from "@/lib/store";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, GitBranch, ChevronsRight, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ConflictResolver from "../conflict-resolver";
import { resolveConflict } from '../actions';
import { useToast } from '@/hooks/use-toast';


export default function MergeConflictPage({ params }: { params: { slug: string[] } }) {
    const [pr, setPr] = useState<PullRequest | null>(null);
    const [diff, setDiff] = useState<string | null>(null);
    const [initialContent, setInitialContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const repoOwner = params.slug[0];
    const repoName = params.slug[1];
    const prNumber = parseInt(params.slug[2], 10);
    const repoFullName = `${repoOwner}/${repoName}`;
    const filePath = params.slug.slice(3).join('/');

    const [state, formAction] = useActionState(resolveConflict, { success: false, message: '' });
    const { toast } = useToast();

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({ title: "Success", description: state.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: state.message });
            }
        }
    }, [state, toast]);

    useEffect(() => {
        if (repoFullName && prNumber) {
            setLoading(true);
            getPullRequest(repoFullName, prNumber)
            .then(prData => {
                setPr(prData);
                if (!prData) throw new Error("Pull Request not found.");

                return Promise.all([
                    getFileDiff(repoFullName, prData.targetBranch, prData.sourceBranch, filePath),
                    getFileContent(repoFullName, prData.sourceBranch, filePath)
                ]);
            })
            .then(([diffData, contentData]) => {
                setDiff(diffData);
                setInitialContent(contentData.content);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
        }
    }, [repoFullName, prNumber, filePath]);

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
                            <AlertTitle>Failed to load conflict data</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!pr || diff === null) {
        return (
            <div className="space-y-6">
                {header}
                <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                        Pull Request or file diff not found.
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
                             <CardTitle>Resolve Conflict in <span className="font-mono text-lg">{filePath}</span></CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <GitBranch className="h-4 w-4" />
                                <Badge variant="secondary">{pr.sourceBranch}</Badge>
                                <ChevronsRight className="size-4" />
                                <Badge variant="secondary">{pr.targetBranch}</Badge>
                            </div>
                        </div>
                         <Button asChild variant="outline">
                            <Link href="/dashboard/merge">Back to Conflicts</Link>
                         </Button>
                    </div>
                </CardHeader>
                 <CardContent>
                    <form action={formAction}>
                        <ConflictResolver
                            pr={pr}
                            filePath={filePath}
                            diff={diff}
                            initialContent={initialContent}
                        />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
