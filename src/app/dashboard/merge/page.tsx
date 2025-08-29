
"use client"

import { useAppStore, type Repository, type PullRequest } from "@/lib/store";
import { AlertTriangle, GitBranch, GitPullRequest, ChevronsRight } from "lucide-react"
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ConflictResolver from "./conflict-resolver";
import { getConflictingPullRequests } from "../repositories/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function MergePage() {
    const { setSearchQuery, searchQuery } = useAppStore();
    const [conflicts, setConflicts] = useState<PullRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      // Clear search when navigating to this page
      setSearchQuery('');

      async function fetchConflicts() {
        try {
            setLoading(true);
            setError(null);
            const conflictData = await getConflictingPullRequests();
            setConflicts(conflictData);
        } catch (err: any) {
            setError("Failed to fetch conflicting pull requests. " + (err.message || ''));
        } finally {
            setLoading(false);
        }
      }
      fetchConflicts();
    }, [setSearchQuery]);

    const filteredConflicts = conflicts.filter(conflict => 
        conflict.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conflict.repoFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conflict.sourceBranch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conflict.targetBranch.toLowerCase().includes(searchQuery.toLowerCase())
    )

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Conflict Resolution</h1>
        <p className="text-muted-foreground mt-1">
            Showing all open pull requests with merge conflicts across your repositories.
        </p>
      </header>

      {loading ? (
          <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                   <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                        </CardHeader>
                        <CardContent>
                             <p className="mb-4 text-sm text-muted-foreground">
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </p>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                   </Card>
              ))}
          </div>
      ) : error ? (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to load conflicts</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : filteredConflicts.length === 0 ? (
        <Card className="text-center py-12">
             <CardContent className="space-y-4">
                <div className="flex justify-center">
                    <GitPullRequest className="size-12 text-muted" />
                </div>
                <h3 className="text-xl font-semibold">No Conflicts Found</h3>
                <p className="text-muted-foreground">
                    {searchQuery ? "Your search did not match any conflicts." : "Great job! There are no open pull requests with merge conflicts."}
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
            {filteredConflicts.map((pr) => (
                <Card key={pr.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                     <AlertTriangle className="h-5 w-5 text-destructive" />
                                    <span>{pr.repoFullName}</span>
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    <a href={pr.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        PR #{pr.number}: {pr.title}
                                    </a>
                                </CardDescription>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                    <GitBranch className="h-4 w-4" />
                                    <Badge variant="secondary">{pr.sourceBranch}</Badge>
                                    <ChevronsRight className="size-4" />
                                    <Badge variant="secondary">{pr.targetBranch}</Badge>
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                               <a href={pr.url} target="_blank" rel="noopener noreferrer">View on GitHub</a>
                            </Button>
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
                </Card>
            ))}
        </div>
      )}
    </div>
  )
}
