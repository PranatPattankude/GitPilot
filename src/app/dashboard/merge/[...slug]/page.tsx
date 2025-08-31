"use client"

import { useEffect, useState, useTransition, useMemo } from "react"
import { getPullRequest, getFileContent, mergePullRequest as mergePrAction } from "../../repositories/actions";
import { type PullRequest } from "@/lib/store";
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, GitBranch, ChevronsRight, GitMerge, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ConflictResolver from "../conflict-resolver";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from "next/navigation";


export default function MergeConflictPage({ params }: { params: { slug: string[] } }) {
    const [pr, setPr] = useState<PullRequest | null>(null);
    const [targetContent, setTargetContent] = useState<string | null>(null);
    const [sourceContent, setSourceContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isResolved, setIsResolved] = useState(false);
    const [isMerging, startMergeTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();
    
    const repoOwner = params.slug[0];
    const repoName = params.slug[1];
    const prNumber = parseInt(params.slug[2], 10);
    const repoFullName = useMemo(() => `${repoOwner}/${repoName}`, [repoOwner, repoName]);
    const filePath = useMemo(() => params.slug.slice(3).join('/'), [params.slug]);


    useEffect(() => {
        async function fetchData() {
            if (!repoFullName || !prNumber) return;

            setLoading(true);
            setError(null);
            try {
                // First, get the Pull Request details
                const prData = await getPullRequest(repoFullName, prNumber);
                if (!prData) throw new Error("Pull Request not found.");
                setPr(prData);

                // Now that we have the PR data, fetch content for both branches
                const [sourceData, targetData] = await Promise.all([
                    getFileContent(repoFullName, prData.sourceBranch, filePath),
                    getFileContent(repoFullName, prData.targetBranch, filePath)
                ]);

                setSourceContent(sourceData.content);
                setTargetContent(targetData.content);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [repoFullName, prNumber, filePath]);
    
    const handleFinalMerge = () => {
        if (!pr) return;
        startMergeTransition(async () => {
            const result = await mergePrAction(pr.repoFullName, pr.number);
            if (result.success) {
                toast({ title: "Success!", description: "Pull request has been successfully merged." });
                router.push("/dashboard/merge?status=resolved");
            } else {
                 toast({ variant: "destructive", title: "Merge Failed", description: result.error || "An unknown error occurred during the merge." });
            }
        });
    }

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

    if (!pr || sourceContent === null || targetContent === null) {
        return (
            <div className="space-y-6">
                {header}
                <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                        Pull Request or file content not found.
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
                      <ConflictResolver
                          pr={pr}
                          filePath={filePath}
                          targetContent={targetContent}
                          sourceContent={sourceContent}
                          onResolved={() => setIsResolved(true)}
                      />
                  </CardContent>
                  {isResolved && (
                    <CardFooter className="flex justify-end items-center gap-4 border-t pt-6">
                         <Button onClick={handleFinalMerge} disabled={isMerging} size="lg">
                              {isMerging ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Merging...
                                </>
                              ) : (
                                <>
                                  Commit Resolution & Merge PR <GitMerge className="ml-2 h-4 w-4" />
                                </>
                              )}
                         </Button>
                    </CardFooter>
                  )}
              </Card>
        </div>
    )
}
