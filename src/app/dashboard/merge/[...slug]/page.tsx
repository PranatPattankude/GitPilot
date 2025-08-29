
"use client"

import { useEffect, useState } from "react"
import { getPullRequest } from "../../repositories/actions";
import { type PullRequest } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, GitBranch, ChevronsRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ConflictResolver from "../conflict-resolver";


export default function MergeConflictPage({ params }: { params: { slug: string[] } }) {
    const [pr, setPr] = useState<PullRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const repoOwner = params.slug[0];
    const repoName = params.slug[1];
    const prNumber = parseInt(params.slug[2], 10);
    const repoFullName = `${repoOwner}/${repoName}`;


    useEffect(() => {
        if (repoFullName && prNumber) {
            setLoading(true);
            getPullRequest(repoFullName, prNumber)
            .then(setPr)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
        }
    }, [repoFullName, prNumber]);

    return (
         <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Resolve Conflict</h1>
                {loading ? (
                    <Skeleton className="h-5 w-1/2 mt-1" />
                ) : pr ? (
                    <p className="text-muted-foreground mt-1">
                        For <Link href={`/dashboard/merge`} className="text-primary hover:underline">PR #{pr.number}: {pr.title}</Link> in <span className="font-medium text-foreground">{pr.repoFullName}</span>
                    </p>
                ) : (
                    <p className="text-muted-foreground mt-1">Loading pull request details...</p>
                )}
            </header>
            
            <Card>
                {loading ? (
                    <>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                             <p className="mb-4 text-sm text-muted-foreground">
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </p>
                            <Skeleton className="h-96 w-full" />
                        </CardContent>
                    </>
                ) : error ? (
                    <CardContent className="py-6">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Failed to load Pull Request</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </CardContent>
                ) : pr ? (
                    <>
                        <CardHeader>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <GitBranch className="h-4 w-4" />
                                <Badge variant="secondary">{pr.sourceBranch}</Badge>
                                <ChevronsRight className="size-4" />
                                <Badge variant="secondary">{pr.targetBranch}</Badge>
                            </div>
                        </CardHeader>
                         <CardContent>
                            <p className="mb-4 text-sm text-muted-foreground">
                                The diff below is loaded from the pull request. Manually resolve the conflicts into the "Your Resolution" box. 
                                <br />
                                Optionally, provide the rest of the file content in "Unseen Lines" to have the AI apply your fix to other parts of the file.
                            </p>
                            <ConflictResolver repoFullName={pr.repoFullName} prNumber={pr.number}/>
                        </CardContent>
                    </>
                ): (
                     <CardContent className="py-6 text-center text-muted-foreground">
                        Pull Request not found.
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
