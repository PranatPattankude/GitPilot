
"use client"

import { useAppStore, type Repository } from "@/lib/store";
import { AlertTriangle, GitBranch, ChevronsRight } from "lucide-react"
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ConflictResolver from "./conflict-resolver";
import { getRepositories, compareBranches } from "../repositories/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


export default function MergePage() {
    const { setSearchQuery } = useAppStore();
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
    const [sourceBranch, setSourceBranch] = useState<string>("");
    const [targetBranch, setTargetBranch] = useState<string>("");
    
    const [isComparing, setIsComparing] = useState(false);
    const [conflictFound, setConflictFound] = useState(false);
    const [comparisonError, setComparisonError] = useState<string | null>(null);
    const [noChanges, setNoChanges] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
      // Clear search when navigating to this page
      setSearchQuery('');
      
      async function fetchRepos() {
        try {
            setLoading(true);
            setError(null);
            const repoData = await getRepositories();
            setRepos(repoData);
        } catch (err: any) {
            setError("Failed to fetch repositories. " + (err.message || ''));
        } finally {
            setLoading(false);
        }
      }
      fetchRepos();
    }, [setSearchQuery]);

    const handleRepoChange = (repoId: string) => {
        const repo = repos.find(r => r.id === repoId) || null;
        setSelectedRepo(repo);
        setSourceBranch("");
        setTargetBranch(repo?.branches.includes('main') ? 'main' : repo?.branches[0] || "");
        resetComparison();
    }

    const handleBranchChange = () => {
        resetComparison();
    }

    const resetComparison = () => {
        setConflictFound(false);
        setComparisonError(null);
        setNoChanges(false);
    }
    
    const handleCheckConflicts = async () => {
        if (!selectedRepo || !sourceBranch || !targetBranch) {
            toast({ variant: "destructive", title: "Missing selection", description: "Please select a repository, source branch, and target branch."});
            return;
        }

        setIsComparing(true);
        resetComparison();

        try {
            const result = await compareBranches(selectedRepo.fullName, sourceBranch, targetBranch);
            if (result.status === 'has-conflicts') {
                setConflictFound(true);
                if(result.error) setComparisonError(result.error);
            } else if (result.status === 'no-changes') {
                setNoChanges(true);
            } else {
                setComparisonError("These branches can be merged cleanly without conflicts.");
            }
        } catch (err: any) {
            setComparisonError(err.message);
        } finally {
            setIsComparing(false);
        }
    }


  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Conflict Resolution</h1>
        <p className="text-muted-foreground mt-1">Intelligent merge conflict detection and resolution across repositories.</p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Select a Repository and Branches</CardTitle>
            <CardDescription>Choose a repository and the branches you want to check for merge conflicts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Failed to load repositories</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="repository">Repository</Label>
                        <Select onValueChange={handleRepoChange}>
                            <SelectTrigger id="repository">
                                <SelectValue placeholder="Select a repository" />
                            </SelectTrigger>
                            <SelectContent>
                                {repos.map(repo => (
                                    <SelectItem key={repo.id} value={repo.id}>{repo.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedRepo && (
                         <div className="grid grid-cols-2 gap-4 md:col-span-2 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="source-branch">Source Branch</Label>
                                <Select value={sourceBranch} onValueChange={(value) => { setSourceBranch(value); handleBranchChange(); }}>
                                    <SelectTrigger id="source-branch">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedRepo.branches.map(branch => (
                                            <SelectItem key={branch} value={branch} disabled={branch === targetBranch}>{branch}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="target-branch">Target Branch</Label>
                                <Select value={targetBranch} onValueChange={(value) => { setTargetBranch(value); handleBranchChange(); }}>
                                    <SelectTrigger id="target-branch">
                                        <SelectValue placeholder="Select target" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedRepo.branches.map(branch => (
                                            <SelectItem key={branch} value={branch} disabled={branch === sourceBranch}>{branch}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
            )}
             <Button onClick={handleCheckConflicts} disabled={!selectedRepo || !sourceBranch || !targetBranch || isComparing}>
                {isComparing ? 'Checking...' : 'Check for Conflicts'}
             </Button>
        </CardContent>
      </Card>
      
      {comparisonError && (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Comparison Result</AlertTitle>
            <AlertDescription>{comparisonError}</AlertDescription>
        </Alert>
      )}

      {noChanges && (
         <Alert>
            <GitBranch className="h-4 w-4" />
            <AlertTitle>No Changes</AlertTitle>
            <AlertDescription>The selected branches are identical. There is nothing to merge.</AlertDescription>
        </Alert>
      )}

      {conflictFound && selectedRepo && (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <h2 className="text-xl font-semibold">{selectedRepo.name}</h2>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <GitBranch className="h-4 w-4" />
                            <Badge variant="secondary">{sourceBranch}</Badge>
                            <ChevronsRight className="size-4" />
                            <Badge variant="secondary">{targetBranch}</Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                    Conflicts were detected between the selected branches. Use the tool below to resolve them.
                    <br />
                    The file diff below is an example. In a real application, this would be populated with the actual conflicting file content from your repository.
                </p>
                <ConflictResolver />
            </CardContent>
        </Card>
      )}

    </div>
  )
}
