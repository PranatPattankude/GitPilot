
"use client"

import { useEffect, useState, useMemo } from "react"
import { getPullRequest } from "../../repositories/actions";
import { type PullRequest } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, GitBranch, ChevronsRight, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ConflictResolver from "../conflict-resolver";


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
        // The file path might contain slashes, which are encoded in the URL.
        // We decode it here to get the original path.
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

    return (
         <div className="space-y-6">
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
                ) : pr && repoFullName && prNumber && filePath ? (
                    <>
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
                            <ConflictResolver pr={pr} filePath={filePath} />
                        </CardContent>
                    </>
                ): (
                     <CardContent className="py-6 text-center text-muted-foreground">
                        Pull Request not found or file path is missing.
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
