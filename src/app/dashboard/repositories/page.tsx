"use client"

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useAppStore, type Repository } from "@/lib/store"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Calendar, Star, GitFork, AlertCircle, GitPullRequest, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const staticRepos: Repository[] = [
    { id: '1', name: 'gitpilot-ui', owner: 'acme-corp', url: '', lastUpdated: '2 days ago', language: 'TypeScript', tags: ['frontend', 'nextjs'], stars: 124, forks: 23, openIssues: 8, pullRequests: 3, contributors: 12 },
    { id: '2', name: 'firebase-functions-sdk', owner: 'acme-corp', url: '', lastUpdated: '3 days ago', language: 'TypeScript', tags: ['backend', 'firebase'], stars: 256, forks: 45, openIssues: 12, pullRequests: 5, contributors: 23 },
    { id: '3', name: 'react-fire-hooks', owner: 'acme-corp', url: '', lastUpdated: '5 days ago', language: 'TypeScript', tags: ['frontend', 'react'], stars: 512, forks: 89, openIssues: 23, pullRequests: 11, contributors: 34 },
    { id: '4', name: 'project-phoenix', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'JavaScript', tags: ['monorepo'], stars: 1024, forks: 123, openIssues: 34, pullRequests: 17, contributors: 45 },
    { id: '5', name: 'quantum-leap-engine', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'Python', tags: ['ml', 'ai'], stars: 2048, forks: 256, openIssues: 45, pullRequests: 23, contributors: 56 },
    { id: '6', name: 'nomad-travel-app', owner: 'globex-inc', url: '', lastUpdated: '1 day ago', language: 'Go', tags: ['backend', 'api'], stars: 4096, forks: 512, openIssues: 56, pullRequests: 29, contributors: 67 },
    { id: '7', name: 'recipe-finder-api', owner: 'globex-inc', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['backend', 'api'], stars: 8192, forks: 1024, openIssues: 67, pullRequests: 35, contributors: 78 },
    { id: '8', name: 'crypto-tracker', owner: 'acme-corp', url: '', lastUpdated: '6 days ago', language: 'Rust', tags: ['backend', 'crypto'], stars: 16384, forks: 2048, openIssues: 78, pullRequests: 41, contributors: 89 },
    { id: '9', name: 'portfolio-generator', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'JavaScript', tags: ['frontend', 'react'], stars: 32768, forks: 4096, openIssues: 89, pullRequests: 47, contributors: 100 },
    { id: '10', name: 'data-viz-library', owner: 'stark-industries', url: '', lastUpdated: '2 weeks ago', language: 'TypeScript', tags: ['dataviz', 'charts'], stars: 65536, forks: 8192, openIssues: 100, pullRequests: 53, contributors: 111 },
    { id: '11', name: 'e-commerce-storefront', owner: 'stark-industries', url: '', lastUpdated: '3 weeks ago', language: 'TypeScript', tags: ['frontend', 'e-commerce'], stars: 131072, forks: 16384, openIssues: 111, pullRequests: 59, contributors: 122 },
    { id: '12', name: 'realtime-chat-app', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'Go', tags: ['backend', 'websockets'], stars: 262144, forks: 32768, openIssues: 122, pullRequests: 65, contributors: 133 },
    { id: '13', name: 'iot-dashboard', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'TypeScript', tags: ['iot', 'dashboard'], stars: 524288, forks: 65536, openIssues: 133, pullRequests: 71, contributors: 144 },
    { id: '14', name: 'machine-learning-model', owner: 'wayne-enterprises', url: '', lastUpdated: '2 days ago', language: 'Python', tags: ['ml', 'ai'], stars: 1048576, forks: 131072, openIssues: 144, pullRequests: 77, contributors: 155 },
    { id: '15', name: 'cybersecurity-toolkit', owner: 'wayne-enterprises', url: '', lastUpdated: '5 days ago', language: 'Rust', tags: ['security'], stars: 2097152, forks: 262144, openIssues: 155, pullRequests: 83, contributors: 166 },
    { id: '16', name: 'cloud-storage-solution', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'Go', tags: ['backend', 'storage'], stars: 4194304, forks: 524288, openIssues: 166, pullRequests: 89, contributors: 177 },
    { id: '17', name: 'mobile-game-engine', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'C++', tags: ['gaming', 'mobile'], stars: 8388608, forks: 1048576, openIssues: 177, pullRequests: 95, contributors: 188 },
    { id: '18', name: 'video-streaming-service', owner: 'globex-inc', url: '', lastUpdated: '3 weeks ago', language: 'Go', tags: ['backend', 'video'], stars: 16777216, forks: 2097152, openIssues: 188, pullRequests: 101, contributors: 199 },
    { id: '19', name: 'automated-testing-framework', owner: 'globex-inc', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['testing', 'devops'], stars: 33554432, forks: 4194304, openIssues: 199, pullRequests: 107, contributors: 210 },
    { id: '20', name: 'social-media-aggregator', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'JavaScript', tags: ['frontend', 'api'], stars: 67108864, forks: 8388608, openIssues: 210, pullRequests: 113, contributors: 221 },
    { id: '21', name: 'blogging-platform', owner: 'stark-industries', url: '', lastUpdated: '1 day ago', language: 'Go', tags: ['backend'], stars: 134217728, forks: 16777216, openIssues: 221, pullRequests: 119, contributors: 232 },
    { id: '22', name: 'devops-pipeline-manager', owner: 'wayne-enterprises', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['devops', 'ci-cd'], stars: 268435456, forks: 33554432, openIssues: 232, pullRequests: 125, contributors: 243 },
    { id: '23', name: 'graphql-server-template', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'TypeScript', tags: ['backend', 'graphql'], stars: 536870912, forks: 67108864, openIssues: 243, pullRequests: 131, contributors: 254 },
    { id: '24', name: 'design-system-ui-kit', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'TypeScript', tags: ['frontend', 'ui-kit'], stars: 1073741824, forks: 134217728, openIssues: 254, pullRequests: 137, contributors: 265 },
    { id: '25', name: 'financial-analytics-tool', owner: 'wayne-enterprises', url: '', lastUpdated: '3 days ago', language: 'Python', tags: ['finance', 'analytics'], stars: 2147483648, forks: 268435456, openIssues: 265, pullRequests: 143, contributors: 276 },
    { id: '26', name: 'collaboration-platform', owner: 'stark-industries', url: '', lastUpdated: '1 week ago', language: 'TypeScript', tags: ['collaboration', 'saas'], stars: 4294967296, forks: 536870912, openIssues: 276, pullRequests: 149, contributors: 287 },
    { id: '27', name: 'log-management-system', owner: 'globex-inc', url: '', lastUpdated: '2 weeks ago', language: 'Go', tags: ['backend', 'logging'], stars: 8589934592, forks: 1073741824, openIssues: 287, pullRequests: 155, contributors: 298 },
    { id: '28', name: 'customer-support-chatbot', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['chatbot', 'ai'], stars: 17179869184, forks: 2147483648, openIssues: 298, pullRequests: 161, contributors: 309 },
    { id: '29', name: 'healthcare-data-platform', owner: 'wayne-enterprises', url: '', lastUpdated: '5 days ago', language: 'Python', tags: ['healthcare', 'data'], stars: 34359738368, forks: 4294967296, openIssues: 309, pullRequests: 167, contributors: 320 },
    { id: '30', name: 'smart-home-controller', owner: 'stark-industries', url: '', lastUpdated: '2 weeks ago', language: 'Rust', tags: ['iot', 'smart-home'], stars: 68719476736, forks: 8589934592, openIssues: 320, pullRequests: 173, contributors: 331 },
    { id: '31', name: 'geospatial-analysis-api', owner: 'globex-inc', url: '', lastUpdated: '1 week ago', language: 'Go', tags: ['backend', 'gis'], stars: 137438953472, forks: 17179869184, openIssues: 331, pullRequests: 179, contributors: 342 },
    { id: '32', name: 'virtual-reality-sdk', owner: 'acme-corp', url: '', lastUpdated: '3 weeks ago', language: 'C++', tags: ['vr', 'sdk'], stars: 274877906944, forks: 34359738368, openIssues: 342, pullRequests: 185, contributors: 353 },
    { id: '33', name: 'code-review-assistant', owner: 'wayne-enterprises', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['dev-tools', 'ai'], stars: 549755813888, forks: 68719476736, openIssues: 353, pullRequests: 191, contributors: 364 },
    { id: '34', name: 'music-recommendation-engine', owner: 'stark-industries', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['ml', 'music'], stars: 1099511627776, forks: 137438953472, openIssues: 364, pullRequests: 197, contributors: 375 },
];

export default function RepositoriesPage() {
  const router = useRouter()
  const { selectedRepos, addRepo, removeRepo, setRepos: setGlobalRepos, clearRepos } = useAppStore()
  const [localRepos, setLocalRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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
  
  const filteredRepos = localRepos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredRepos.length > 0 && selectedRepos.length === filteredRepos.length
  const isIndeterminate = selectedRepos.length > 0 && selectedRepos.length < filteredRepos.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Repository Management</h1>
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <span>{localRepos.length} repositories • {selectedRepos.length} selected</span>
            )}
          </div>
        </div>
      <Card>
        <CardHeader className="p-4">
           <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      onCheckedChange={handleSelectAll} 
                      checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                      aria-label="Select all"
                      disabled={loading}
                    />
                  </TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2 mt-1" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell>
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
                      <TableCell><div className="flex gap-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /></div></TableCell>
                      <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredRepos.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell>
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
                      <TableCell>{repo.language}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            <span>{repo.lastUpdated}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div className="flex items-center gap-1.5">
                              <Star className="size-3" />
                              <span>{repo.stars.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <GitFork className="size-3" />
                              <span>{repo.forks.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="size-3" />
                              <span>{repo.openIssues.toLocaleString()}</span>
                            </div>
                             <div className="flex items-center gap-1.5">
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
                        <div className="flex flex-wrap gap-1">
                          {repo.tags.map(tag => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
                        </div>
                      </TableCell>
                       <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {selectedRepos.length > 0 && !loading && (
        <div className="fixed bottom-6 right-6">
          <Button onClick={() => router.push('/dashboard/merge')} size="lg" className="shadow-lg">
            Proceed to Merge ({selectedRepos.length})
          </Button>
        </div>
      )}
    </div>
  )
}
