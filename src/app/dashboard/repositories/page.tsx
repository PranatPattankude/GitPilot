
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
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useAppStore, type Repository } from "@/lib/store"
import { useEffect, useState, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Calendar, Star, GitFork, AlertCircle, GitPullRequest, Users, Pencil, GitMerge, Rocket, CheckCircle2, XCircle, Loader, ListFilter, Tag, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EditTagsDialog } from "./edit-tags-dialog"
import { MergeDialog } from "./merge-dialog"
import { BuildStatusDialog } from "./build-status-dialog"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BulkMergeDialog } from "./bulk-merge-dialog"
import { RebuildDialog } from "./rebuild-dialog"
import { getRepositories } from "./actions"
import { formatDistanceToNow } from 'date-fns'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GithubIcon } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      setError(null);
      try {
        const repos = await getRepositories();
        setLocalRepos(repos);
      } catch (err: any) {
        setError("Failed to fetch repositories from GitHub. " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
    
    // Clear search and selection when navigating away
    return () => {
      setSearchQuery('');
      clearRepos();
    }
  }, [clearRepos, setSearchQuery]);

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

  const handleUpdateTags = (repoId: string, newTags: string[]) => {
    setLocalRepos(prevRepos => 
      prevRepos.map(repo => 
        repo.id === repoId ? { ...repo, tags: newTags } : repo
      )
    );
  }

  const handleMerge = (repoId: string, sourceBranch: string, targetBranch: string) => {
    const repo = localRepos.find(r => r.id === repoId);
    if (repo) {
      toast({
        title: "Merge Initiated",
        description: `Merging ${sourceBranch} into ${targetBranch} for ${repo.name}.`,
      });
    }
  };

  const handleRebuild = (repoId: string, branch: string) => {
    const repo = localRepos.find(r => r.id === repoId);
    if (repo) {
      toast({
        title: "Rebuild Initiated",
        description: `A new build has been started for the ${branch} branch in ${repo.name}.`,
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
                      disabled={loading || error}
                    />
                  </TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead className="hidden md:table-cell">Language</TableHead>
                  <TableHead className="hidden lg:table-cell">Activity</TableHead>
                  <TableHead>Builds (Last 12h)</TableHead>
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
                            <div className="font-medium">{repo.name}</div>
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
                        >
                          <div className="flex items-center gap-1 text-primary">
                            <Loader className={`size-3`} />
                            <span>0</span>
                          </div>
                          <div className="flex items-center gap-1 text-accent">
                            <CheckCircle2 className="size-3" />
                            <span>0</span>
                          </div>
                           <div className="flex items-center gap-1 text-destructive">
                            <XCircle className="size-3" />
                            <span>0</span>
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
                            <DropdownMenuItem onSelect={() => setEditingRepo(repo)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit Tags</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setMergingRepo(repo)}>
                              <GitMerge className="mr-2 h-4 w-4" />
                              <span>Merge</span>
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
