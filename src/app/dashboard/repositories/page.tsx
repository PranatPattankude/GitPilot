
"use client"

import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useAppStore, type Repository } from "@/lib/store"
import { useEffect, useState, useMemo, startTransition, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Calendar, Star, GitFork, AlertCircle, GitPullRequest, Users, Pencil, GitMerge, Rocket, CheckCircle2, XCircle, Loader, ListFilter, Tag, RefreshCw, Lock, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EditTagsDialog } from "./edit-tags-dialog"
import { MergeDialog } from "./merge-dialog"
import { BuildStatusDialog } from "./build-status-dialog"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BulkMergeDialog } from "./bulk-merge-dialog"
import { RebuildDialog } from "./rebuild-dialog"
import { getRepositories, createPullRequest, mergePullRequest, rerunAllJobs } from "./actions"
import { formatDistanceToNow } from 'date-fns'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GithubIcon } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

export default function RepositoriesPage() {
  const { toast } = useToast()
  const { searchQuery, setSearchQuery, selectedRepos, addRepo, removeRepo, setRepos: setGlobalRepos, clearRepos } = useAppStore()
  const [localRepos, setLocalRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null)
  const [mergingRepo, setMergingRepo] = useState<Repository | null>(null)
  const [rebuildingRepo, setRebuildingRepo] = useState<Repository | null>(null)
  const [viewingBuildsRepo, setViewingBuildsRepo] = useState<Repository | null>(null)
  const [isBulkMerging, setIsBulkMerging] = useState(false)
  const router = useRouter();


  const fetchRepos = useCallback((isInitialFetch = false) => {
    if (isInitialFetch) {
      setLoading(true);
    }
    setError(null);
    getRepositories()
      .then((repos) => {
        startTransition(() => {
          setLocalRepos(repos);
        });
      })
      .catch((err) => {
         startTransition(() => {
          setError("Failed to fetch repositories. " + err.message);
         });
      })
      .finally(() => {
         if (isInitialFetch) {
            startTransition(() => {
              setLoading(false);
            });
         }
      });
  }, []);

  useEffect(() => {
    fetchRepos(true); // Initial fetch
    
    // Set up polling to refresh every 30 seconds
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing repositories...");
      fetchRepos(false);
    }, 30000); 
    
    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId); 
      setSearchQuery('');
      clearRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRepos]);

  const allTags = useMemo(() => {
    return Array.from(new Set(localRepos.flatMap(repo => repo.tags))).sort()
  }, [localRepos])

  const handleSelectRepo = (repo: Repository) => {
    if (selectedRepos.some((r) => r.id === repo.id)) {
      removeRepo(repo.id)
    } else {
      addRepo(repo)
    }
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setGlobalRepos(filteredRepos)
    } else {
      clearRepos()
    }
  }

  const handleUpdateTags = async (repoId: string, newTags: string[]) => {
    // Optimistically update the UI
    setLocalRepos(prevRepos =>
      prevRepos.map(repo =>
        repo.id === repoId ? { ...repo, tags: newTags } : repo
      )
    );
     toast({
        title: "Tags Updated (Local)",
        description: `Tags have been updated locally. In a real app, this would be saved to a database.`,
      });
  };

  const handleMerge = async (repoFullName: string, sourceBranch: string, targetBranch: string, isDraft: boolean) => {
    const prResult = await createPullRequest(repoFullName, sourceBranch, targetBranch, isDraft);
    
    if (!prResult.success || !prResult.data) {
      toast({
        variant: "destructive",
        title: "Failed to Create Pull Request",
        description: prResult.error,
      });
      return prResult;
    }

    toast({
        title: "Pull Request Created",
        description: `Successfully created PR #${prResult.data.number}. Now attempting to merge...`,
    });
    
    if (isDraft) {
      toast({
        title: "Draft PR Created",
        description: (
          <span>
            Draft PR #{prResult.data.number} created due to conflicts. Please{" "}
            <a href={prResult.data.html_url} target="_blank" rel="noopener noreferrer" className="underline font-bold">
              resolve them on GitHub
            </a>
            .
          </span>
        ),
      });
       fetchRepos(); // Refresh data to show new PR
       return { ...prResult, success: false }; // Not a "success" in terms of merging
    }
    
    const mergeResult = await mergePullRequest(repoFullName, prResult.data.number);

    if (mergeResult.success) {
      toast({
        title: "Pull Request Merged",
        description: (
          <a href={prResult.data.html_url} target="_blank" rel="noopener noreferrer" className="underline">
            Successfully merged PR #{prResult.data.number} for {repoFullName}. Click to view.
          </a>
        ),
      });
      router.push('/dashboard/builds');
    } else {
       toast({
        variant: "destructive",
        title: "Failed to Merge Pull Request",
        description: mergeResult.error,
      });
    }
    
    fetchRepos(); // Refresh data
    return mergeResult;
  };

  const handleRebuild = async (repoId: string, branch: string) => {
    const repo = localRepos.find(r => r.id === repoId);
    if (!repo) return;

    // Find the most recent build for the selected branch
    const latestBuildForBranch = repo.recentBuilds
      .filter(build => build.branch === branch)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (!latestBuildForBranch) {
      toast({
        variant: "destructive",
        title: "No Build Found",
        description: `There are no recent builds for the "${branch}" branch to rerun.`,
      });
      return;
    }

    toast({
      title: "Rebuild Initiated",
      description: `Rerunning all jobs for the latest build on the "${branch}" branch in ${repo.name}.`,
    });

    try {
      const result = await rerunAllJobs(repo.fullName, latestBuildForBranch.id);
      if (result.success) {
        toast({
          title: "Rebuild Triggered Successfully",
          description: "A new workflow run has started. You can monitor its progress on the Build Status page.",
        });
        router.push('/dashboard/builds');
      } else {
        toast({
          variant: "destructive",
          title: "Rebuild Failed",
          description: result.error || "Could not trigger the rebuild.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Rebuild Error",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const handleTagFilterChange = (tag: string, checked: boolean) => {
    setSelectedTags(prev => 
      checked ? [...prev, tag] : prev.filter(t => t !== tag)
    )
  }
  
  const filteredRepos = localRepos.filter((repo) => {
    const searchMatch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.owner.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.language && repo.language.toLowerCase().includes(searchQuery.toLowerCase())) ||
      repo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const tagMatch = selectedTags.length === 0 || selectedTags.every(tag => repo.tags.includes(tag))
    
    return searchMatch && tagMatch
  });

  const isAllSelected = filteredRepos.length > 0 && selectedRepos.length === filteredRepos.length
  const isIndeterminate = selectedRepos.length > 0 && selectedRepos.length < filteredRepos.length;

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Repository Management</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {loading ? (
              <Skeleton className="h-4 w-48" />
            ) : error ? (
              <span>&nbsp;</span>
            ) : (
              <span>{filteredRepos.length} of {localRepos.length} repositories shown • {selectedRepos.length} selected</span>
            )}
          </div>
        </div>
      </div>
      <Card>
        <CardHeader className="border-b flex-row items-center gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search repositories..."
                  className="pl-9 w-full bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1 w-full sm:w-auto">
                      <ListFilter className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Filter by Tags</span>
                      {selectedTags.length > 0 && (
                        <>
                          <Separator orientation="vertical" className="mx-1 h-4" />
                          <Badge variant="secondary" className="rounded-sm px-1.5 font-normal">
                            {selectedTags.length}
                          </Badge>
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-48">
                      {allTags.length > 0 ? allTags.map(tag => (
                        <DropdownMenuCheckboxItem
                          key={tag}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={(checked) => handleTagFilterChange(tag, Boolean(checked))}
                        >
                          {tag}
                        </DropdownMenuCheckboxItem>
                      )) : (
                        <DropdownMenuItem disabled>No tags found</DropdownMenuItem>
                      )}
                    </ScrollArea>
                    {selectedTags.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setSelectedTags([])} className="justify-center text-center">
                          Clear filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] px-4">
                    <Checkbox 
                      onCheckedChange={handleSelectAll} 
                      checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                      aria-label="Select all"
                      disabled={loading || !!error}
                    />
                  </TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead className="hidden md:table-cell">Language</TableHead>
                  <TableHead className="hidden lg:table-cell">Activity</TableHead>
                  <TableHead>Builds (Last 24h)</TableHead>
                  <TableHead className="hidden sm:table-cell">Tags</TableHead>
                  <TableHead className="w-[50px] text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-4"><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Skeleton className="size-6 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-2">
                           <Skeleton className="h-3 w-24" />
                           <div className="flex gap-4">
                             <Skeleton className="h-3 w-8" />
                             <Skeleton className="h-3 w-8" />
                             <Skeleton className="h-3 w-8" />
                           </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><div className="flex gap-2"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-16" /></div></TableCell>
                      <TableCell className="text-right pr-4"><Skeleton className="h-6 w-6" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                    <TableRow>
                        <TableCell colSpan={7}>
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </TableCell>
                    </TableRow>
                ) : (
                  filteredRepos.map((repo) => {
                    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const recentBuilds = repo.recentBuilds.filter(b => new Date(b.timestamp) > twentyFourHoursAgo);

                    const buildsInProgress = recentBuilds.filter(b => b.status === 'In Progress').length;
                    const buildsSucceeded = recentBuilds.filter(b => b.status === 'Success').length;
                    const buildsFailed = recentBuilds.filter(b => b.status === 'Failed').length;
                    
                    return (
                    <TableRow key={repo.id}>
                      <TableCell className="px-4">
                        <Checkbox
                          checked={selectedRepos.some((r) => r.id === repo.id)}
                          onCheckedChange={() => handleSelectRepo(repo)}
                          aria-label={`Select ${repo.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-6">
                            <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
                            <AvatarFallback>{repo.owner.login[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{repo.name}</a>
                                <Badge variant="outline" className="font-normal text-xs">
                                    {repo.private ? <Lock className="size-3 mr-1" /> : <Globe className="size-3 mr-1" />}
                                    {repo.private ? 'Private' : 'Public'}
                                </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {repo.owner.login}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{repo.language || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            <span>Updated {formatDistanceToNow(new Date(repo.updated_at))} ago</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="flex items-center gap-1">
                              <Star className="size-3" />
                              <span>{repo.stargazers_count.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="size-3" />
                              <span>{repo.forks_count.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              <span>{repo.open_issues_count.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1 flex items-center gap-2 text-xs"
                          onClick={() => setViewingBuildsRepo(repo)}
                          disabled={repo.recentBuilds.length === 0}
                        >
                          <div className="flex items-center gap-1 text-primary">
                            <Loader className={`size-3 ${buildsInProgress > 0 ? 'animate-spin' : ''}`} />
                            <span>{buildsInProgress}</span>
                          </div>
                          <div className="flex items-center gap-1 text-accent">
                            <CheckCircle2 className="size-3" />
                            <span>{buildsSucceeded}</span>
                          </div>
                            <div className="flex items-center gap-1 text-destructive">
                            <XCircle className="size-3" />
                            <span>{buildsFailed}</span>
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                          {repo.tags.length > 0 ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-auto p-1 text-xs flex items-center gap-1">
                                  <Tag className="size-3.5" />
                                  {repo.tags.length} Tag{repo.tags.length > 1 ? 's' : ''}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Tags</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {repo.tags.map(tag => (
                                  <DropdownMenuItem key={tag} disabled>
                                    <Badge variant="secondary" className="font-normal w-full justify-center">{tag}</Badge>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs flex items-center gap-1 text-muted-foreground" onClick={() => setEditingRepo(repo)}>
                                <Tag className="size-3.5" />
                                Add Tags
                            </Button>
                          )}
                      </TableCell>
                       <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onSelect={() => window.open(repo.html_url, '_blank')}>
                              <GithubIcon className="mr-2 h-4 w-4" />
                              <span>View on GitHub</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setEditingRepo(repo)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit Tags</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setMergingRepo(repo)}>
                              <GitMerge className="mr-2 h-4 w-4" />
                              <span>Create and Merge PR</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => setRebuildingRepo(repo)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>Rebuild</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})
                )}
                {!loading && !error && filteredRepos.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <GithubIcon className="size-12 text-muted" />
                                <h3 className="text-xl font-semibold">No Repositories Found</h3>
                                <p className="text-muted-foreground">
                                    {searchQuery ? "Your search did not match any repositories." : "We couldn't find any repositories for your account."}
                                </p>
                                {error && <p className="text-destructive text-sm mt-2">{error}</p>}
                                {!searchQuery && (
                                    <Button onClick={() => fetchRepos(true)} variant="outline" size="sm">
                                        <RefreshCw className="mr-2 size-4" />
                                        Try Again
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {selectedRepos.length > 0 && !loading && (
        <div className="fixed bottom-6 right-6 z-10">
           <Button onClick={() => setIsBulkMerging(true)} size="lg" className="shadow-lg">
            Proceed to Merge ({selectedRepos.length})
          </Button>
        </div>
      )}
      {editingRepo && (
        <EditTagsDialog 
          repo={editingRepo}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingRepo(null)
          }}
          onSave={handleUpdateTags}
        />
      )}
      {mergingRepo && (
        <MergeDialog
          repo={mergingRepo}
          onOpenChange={(isOpen) => {
            if (!isOpen) setMergingRepo(null)
          }}
          onMerge={handleMerge}
        />
      )}
      {rebuildingRepo && (
        <RebuildDialog
          repo={rebuildingRepo}
          onOpenChange={(isOpen) => {
            if (!isOpen) setRebuildingRepo(null)
          }}
          onRebuild={handleRebuild}
        />
      )}
      {viewingBuildsRepo && (
        <BuildStatusDialog
          repo={viewingBuildsRepo}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewingBuildsRepo(null)
          }}
        />
      )}
       {isBulkMerging && (
        <BulkMergeDialog
          onOpenChange={setIsBulkMerging}
        />
      )}
    </>
  )
}
