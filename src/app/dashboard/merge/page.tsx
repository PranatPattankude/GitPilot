
"use client"

import { useAppStore, type PullRequest, type ChangedFile } from "@/lib/store";
import { AlertTriangle, GitPullRequest, ChevronsRight, FileWarning, GitBranch, ArrowRight } from "lucide-react"
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getConflictingPullRequests } from "../repositories/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function ConflictFile({ file, pr }: { file: ChangedFile, pr: PullRequest }) {
  const encodedFilePath = encodeURIComponent(file.filename);
  const resolveUrl = `/dashboard/merge/${pr.repoFullName}/${pr.number}/${encodedFilePath}`;

  return (
    <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md hover:bg-muted/50">
      <span className="font-mono text-xs">{file.filename}</span>
      <Button asChild variant="secondary" size="sm" className="h-7 gap-1">
        <Link href={resolveUrl}>
          Resolve <ArrowRight className="size-3" />
        </Link>
      </Button>
    </div>
  )
}

export default function MergePage() {
  const { setSearchQuery, searchQuery, addNotifications } = useAppStore();
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
        
        // Notify about new conflicts, but don't hold up the render
        const oldConflictIds = new Set(conflicts.map(c => c.id));
        const newConflicts = conflictData.filter(c => !oldConflictIds.has(c.id));
        if (newConflicts.length > 0) {
            addNotifications(newConflicts.map(pr => ({
                type: 'pr',
                message: `PR #${pr.number} has merge conflicts.`,
                repoFullName: pr.repoFullName,
                url: `/dashboard/merge/${pr.repoFullName}/${pr.number}/${encodeURIComponent(pr.conflictingFiles?.[0]?.filename || '')}`,
                timestamp: pr.created_at,
            })));
        }

        setConflicts(conflictData);
      } catch (err: any) {
        setError("Failed to fetch conflicting pull requests. " + String(err?.message || err || ''));
      } finally {
        setLoading(false);
      }
    }
    fetchConflicts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const query = searchQuery.toLowerCase();
  const filteredConflicts = conflicts.filter(conflict =>
    conflict.title.toLowerCase().includes(query) ||
    conflict.repoFullName.toLowerCase().includes(query) ||
    conflict.sourceBranch.toLowerCase().includes(query) ||
    conflict.targetBranch.toLowerCase().includes(query)
  );

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
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
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
              {searchQuery
                ? "Your search did not match any conflicts."
                : "Great job! There are no open pull requests with merge conflicts."}
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
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
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
                </div>
              </CardHeader>

              {pr.conflictingFiles && pr.conflictingFiles.length > 0 && (
                <CardContent>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <FileWarning className="size-4 text-destructive" />
                    Conflicting Files ({pr.conflictingFiles.length})
                  </h4>
                  <div className="border rounded-md p-2 space-y-1 max-h-64 overflow-y-auto">
                    {pr.conflictingFiles.map((file) => (
                      <ConflictFile key={file.filename} file={file} pr={pr} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
