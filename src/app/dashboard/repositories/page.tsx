"use client"

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { useAppStore, type Repository, type Build } from "@/lib/store"
import { useEffect, useState, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Calendar, Star, GitFork, AlertCircle, GitPullRequest, Users, Pencil, GitMerge, Rocket, CheckCircle2, XCircle, Loader, ListFilter, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EditTagsDialog } from "./edit-tags-dialog"
import { MergeDialog } from "./merge-dialog"
import { BuildStatusDialog } from "./build-status-dialog"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BulkMergeDialog } from "./bulk-merge-dialog"

const staticRepos: Repository[] = [
    { id: '1', name: 'gitpilot-ui', owner: 'acme-corp', url: '', lastUpdated: '2 days ago', language: 'TypeScript', tags: ['frontend', 'nextjs'], stars: 124, forks: 23, openIssues: 8, pullRequests: 3, contributors: 12, recentBuild: { status: 'In Progress' } },
    { id: '2', name: 'firebase-functions-sdk', owner: 'acme-corp', url: '', lastUpdated: '3 days ago', language: 'TypeScript', tags: ['backend', 'firebase'], stars: 256, forks: 45, openIssues: 12, pullRequests: 5, contributors: 23, recentBuild: { status: 'Success' } },
    { id: '3', name: 'react-fire-hooks', owner: 'acme-corp', url: '', lastUpdated: '5 days ago', language: 'TypeScript', tags: ['frontend', 'react'], stars: 512, forks: 89, openIssues: 23, pullRequests: 11, contributors: 34, recentBuild: { status: 'Failed' } },
    { id: '4', name: 'project-phoenix', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'JavaScript', tags: ['monorepo'], stars: 1024, forks: 123, openIssues: 34, pullRequests: 17, contributors: 45, recentBuild: { status: 'Success' } },
    { id: '5', name: 'quantum-leap-engine', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'Python', tags: ['ml', 'ai'], stars: 2048, forks: 256, openIssues: 45, pullRequests: 23, contributors: 56, recentBuild: { status: 'In Progress' } },
    { id: '6', name: 'nomad-travel-app', owner: 'globex-inc', url: '', lastUpdated: '1 day ago', language: 'Go', tags: ['backend', 'api'], stars: 4096, forks: 512, openIssues: 56, pullRequests: 29, contributors: 67, recentBuild: { status: 'Success' } },
    { id: '7', name: 'recipe-finder-api', owner: 'globex-inc', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['backend', 'api'], stars: 8192, forks: 1024, openIssues: 67, pullRequests: 35, contributors: 78, recentBuild: { status: 'Failed' } },
    { id: '8', name: 'crypto-tracker', owner: 'acme-corp', url: '', lastUpdated: '6 days ago', language: 'Rust', tags: ['backend', 'crypto'], stars: 16384, forks: 2048, openIssues: 78, pullRequests: 41, contributors: 89, recentBuild: { status: 'Success' } },
    { id: '9', name: 'portfolio-generator', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'JavaScript', tags: ['frontend', 'react'], stars: 32768, forks: 4096, openIssues: 89, pullRequests: 47, contributors: 100, recentBuild: { status: 'Success' } },
    { id: '10', name: 'data-viz-library', owner: 'stark-industries', url: '', lastUpdated: '2 weeks ago', language: 'TypeScript', tags: ['dataviz', 'charts'], stars: 65536, forks: 8192, openIssues: 100, pullRequests: 53, contributors: 111, recentBuild: { status: 'In Progress' } },
    { id: '11', name: 'e-commerce-storefront', owner: 'stark-industries', url: '', lastUpdated: '3 weeks ago', language: 'TypeScript', tags: ['frontend', 'e-commerce'], stars: 131072, forks: 16384, openIssues: 111, pullRequests: 59, contributors: 122, recentBuild: { status: 'Success' } },
    { id: '12', name: 'realtime-chat-app', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'Go', tags: ['backend', 'websockets'], stars: 262144, forks: 32768, openIssues: 122, pullRequests: 65, contributors: 133, recentBuild: { status: 'Success' } },
    { id: '13', name: 'iot-dashboard', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'TypeScript', tags: ['iot', 'dashboard'], stars: 524288, forks: 65536, openIssues: 133, pullRequests: 71, contributors: 144, recentBuild: { status: 'Failed' } },
    { id: '14', name: 'machine-learning-model', owner: 'wayne-enterprises', url: '', lastUpdated: '2 days ago', language: 'Python', tags: ['ml', 'ai'], stars: 1048576, forks: 131072, openIssues: 144, pullRequests: 77, contributors: 155, recentBuild: { status: 'Success' } },
    { id: '15', name: 'cybersecurity-toolkit', owner: 'wayne-enterprises', url: '', lastUpdated: '5 days ago', language: 'Rust', tags: ['security'], stars: 2097152, forks: 262144, openIssues: 155, pullRequests: 83, contributors: 166, recentBuild: { status: 'Success' } },
    { id: '16', name: 'cloud-storage-solution', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'Go', tags: ['backend', 'storage'], stars: 4194304, forks: 524288, openIssues: 166, pullRequests: 89, contributors: 177, recentBuild: { status: 'In Progress' } },
    { id: '17', name: 'mobile-game-engine', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'C++', tags: ['gaming', 'mobile'], stars: 8388608, forks: 1048576, openIssues: 177, pullRequests: 95, contributors: 188, recentBuild: { status: 'Success' } },
    { id: '18', name: 'video-streaming-service', owner: 'globex-inc', url: '', lastUpdated: '3 weeks ago', language: 'Go', tags: ['backend', 'video'], stars: 16777216, forks: 2097152, openIssues: 188, pullRequests: 101, contributors: 199, recentBuild: { status: 'Success' } },
    { id: '19', name: 'automated-testing-framework', owner: 'globex-inc', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['testing', 'devops'], stars: 33554432, forks: 4194304, openIssues: 199, pullRequests: 107, contributors: 210, recentBuild: { status: 'Failed' } },
    { id: '20', name: 'social-media-aggregator', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'JavaScript', tags: ['frontend', 'api'], stars: 67108864, forks: 8388608, openIssues: 210, pullRequests: 113, contributors: 221, recentBuild: { status: 'Success' } },
    { id: '21', name: 'blogging-platform', owner: 'stark-industries', url: '', lastUpdated: '1 day ago', language: 'Go', tags: ['backend'], stars: 134217728, forks: 16777216, openIssues: 221, pullRequests: 119, contributors: 232, recentBuild: { status: 'Success' } },
    { id: '22', name: 'devops-pipeline-manager', owner: 'wayne-enterprises', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['devops', 'ci-cd'], stars: 268435456, forks: 33554432, openIssues: 232, pullRequests: 125, contributors: 243, recentBuild: { status: 'Success' } },
    { id: '23', name: 'graphql-server-template', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'TypeScript', tags: ['backend', 'graphql'], stars: 536870912, forks: 67108864, openIssues: 243, pullRequests: 131, contributors: 254, recentBuild: { status: 'Failed' } },
    { id: '24', name: 'design-system-ui-kit', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'TypeScript', tags: ['frontend', 'ui-kit'], stars: 1073741824, forks: 134217728, openIssues: 254, pullRequests: 137, contributors: 265, recentBuild: { status: 'Success' } },
    { id: '25', name: 'financial-analytics-tool', owner: 'wayne-enterprises', url: '', lastUpdated: '3 days ago', language: 'Python', tags: ['finance', 'analytics'], stars: 2147483648, forks: 268435456, openIssues: 265, pullRequests: 143, contributors: 276, recentBuild: { status: 'Success' } },
    { id: '26', name: 'collaboration-platform', owner: 'stark-industries', url: '', lastUpdated: '1 week ago', language: 'TypeScript', tags: ['collaboration', 'saas'], stars: 4294967296, forks: 536870912, openIssues: 276, pullRequests: 149, contributors: 287, recentBuild: { status: 'Success' } },
    { id: '27', name: 'log-management-system', owner: 'globex-inc', url: '', lastUpdated: '2 weeks ago', language: 'Go', tags: ['backend', 'logging'], stars: 8589934592, forks: 1073741824, openIssues: 287, pullRequests: 155, contributors: 298, recentBuild: { status: 'Failed' } },
    { id: '28', name: 'customer-support-chatbot', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['chatbot', 'ai'], stars: 17179869184, forks: 2147483648, openIssues: 298, pullRequests: 161, contributors: 309, recentBuild: { status: 'Success' } },
    { id: '29', name: 'healthcare-data-platform', owner: 'wayne-enterprises', url: '', lastUpdated: '5 days ago', language: 'Python', tags: ['healthcare', 'data'], stars: 34359738368, forks: 4294967296, openIssues: 309, pullRequests: 167, contributors: 320, recentBuild: { status: 'Success' } },
    { id: '30', name: 'smart-home-controller', owner: 'stark-industries', url: '', lastUpdated: '2 weeks ago', language: 'Rust', tags: ['iot', 'smart-home'], stars: 68719476736, forks: 8589934592, openIssues: 320, pullRequests: 173, contributors: 331, recentBuild: { status: 'Success' } },
    { id: '31', name: 'geospatial-analysis-api', owner: 'globex-inc', url: '', lastUpdated: '1 week ago', language: 'Go', tags: ['backend', 'gis'], stars: 137438953472, forks: 17179869184, openIssues: 331, pullRequests: 179, contributors: 342, recentBuild: { status: 'Failed' } },
    { id: '32', name: 'virtual-reality-sdk', owner: 'acme-corp', url: '', lastUpdated: '3 weeks ago', language: 'C++', tags: ['vr', 'sdk'], stars: 274877906944, forks: 34359738368, openIssues: 342, pullRequests: 185, contributors: 353, recentBuild: { status: 'Success' } },
    { id: '33', name: 'code-review-assistant', owner: 'wayne-enterprises', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['dev-tools', 'ai'], stars: 549755813888, forks: 68719476736, openIssues: 353, pullRequests: 191, contributors: 364, recentBuild: { status: 'Success' } },
    { id: '34', name: 'music-recommendation-engine', owner: 'stark-industries', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['ml', 'music'], stars: 1099511627776, forks: 137438953472, openIssues: 364, pullRequests: 197, contributors: 375, recentBuild: { status: 'In Progress' } },
];

const buildStatusInfo = {
  "In Progress": { icon: Loader, color: "text-primary", animation: "animate-spin" },
  "Success": { icon: CheckCircle2, color: "text-accent" },
  "Failed": { icon: XCircle, color: "text-destructive" },
}

export default function RepositoriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedRepos, addRepo, removeRepo, setRepos: setGlobalRepos, clearRepos } = useAppStore()
  const [localRepos, setLocalRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null)
  const [mergingRepo, setMergingRepo] = useState<Repository | null>(null)
  const [viewingBuildsRepo, setViewingBuildsRepo] = useState<Repository | null>(null)
  const [isBulkMerging, setIsBulkMerging] = useState(false)

  useEffect(() => {
    setLoading(true);
    // Simulate fetching data
    setTimeout(() => {
        setLocalRepos(staticRepos);
        setLoading(false);
    }, 1000);
    
    return () => {
      clearRepos(); // Clear repo selection on unmount
    }
  }, [clearRepos])

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

  const handleTagFilterChange = (tag: string, checked: boolean) => {
    setSelectedTags(prev => 
      checked ? [...prev, tag] : prev.filter(t => t !== tag)
    )
  }
  
  const filteredRepos = localRepos.filter((repo) => {
    const searchMatch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            ) : (
              <span>{localRepos.length} repositories • {selectedRepos.length} selected</span>
            )}
          </div>
        </div>
      </div>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search repositories..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 w-full sm:w-auto">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tags</span>
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
                  {allTags.map(tag => (
                     <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => handleTagFilterChange(tag, Boolean(checked))}
                     >
                       {tag}
                     </DropdownMenuCheckboxItem>
                  ))}
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
                      disabled={loading}
                    />
                  </TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead className="hidden md:table-cell">Language</TableHead>
                  <TableHead className="hidden lg:table-cell">Activity</TableHead>
                  <TableHead>Builds</TableHead>
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
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2 mt-1" />
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
                           <Skeleton className="h-3 w-20" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><div className="flex gap-2"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-16" /></div></TableCell>
                      <TableCell className="text-right pr-4"><Skeleton className="h-6 w-6" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredRepos.map((repo) => {
                    const statusKey = repo.recentBuild.status as keyof typeof buildStatusInfo;
                    const SvgIcon = buildStatusInfo[statusKey]?.icon || AlertCircle;
                    const color = buildStatusInfo[statusKey]?.color || 'text-muted-foreground';
                    const animation = buildStatusInfo[statusKey]?.animation || '';

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
                        <div className="font-medium">{repo.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {repo.owner}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{repo.language}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            <span>{repo.lastUpdated}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="flex items-center gap-1">
                              <Star className="size-3" />
                              <span>{repo.stars.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="size-3" />
                              <span>{repo.forks.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              <span>{repo.openIssues.toLocaleString()}</span>
                            </div>
                             <div className="flex items-center gap-1">
                              <GitPullRequest className="size-3" />
                              <span>{repo.pullRequests.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="size-3" />
                            <span>{repo.contributors.toLocaleString()} contributors</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-auto px-2 py-0.5 text-xs" onClick={() => setViewingBuildsRepo(repo)}>
                            <SvgIcon className={`mr-1.5 size-3.5 ${color} ${animation}`} />
                            {repo.recentBuild.status}
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
                            <span className="text-xs text-muted-foreground">No tags</span>
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})
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
