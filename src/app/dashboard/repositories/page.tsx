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
import { MoreHorizontal, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const staticRepos: Repository[] = [
    { id: '1', name: 'gitpilot-ui', owner: 'acme-corp', url: '', lastUpdated: '2 days ago', language: 'TypeScript', tags: ['frontend', 'nextjs'] },
    { id: '2', name: 'firebase-functions-sdk', owner: 'acme-corp', url: '', lastUpdated: '3 days ago', language: 'TypeScript', tags: ['backend', 'firebase'] },
    { id: '3', name: 'react-fire-hooks', owner: 'acme-corp', url: '', lastUpdated: '5 days ago', language: 'TypeScript', tags: ['frontend', 'react'] },
    { id: '4', name: 'project-phoenix', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'JavaScript', tags: ['monorepo'] },
    { id: '5', name: 'quantum-leap-engine', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'Python', tags: ['ml', 'ai'] },
    { id: '6', name: 'nomad-travel-app', owner: 'globex-inc', url: '', lastUpdated: '1 day ago', language: 'Go', tags: ['backend', 'api'] },
    { id: '7', name: 'recipe-finder-api', owner: 'globex-inc', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['backend', 'api'] },
    { id: '8', name: 'crypto-tracker', owner: 'acme-corp', url: '', lastUpdated: '6 days ago', language: 'Rust', tags: ['backend', 'crypto'] },
    { id: '9', name: 'portfolio-generator', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'JavaScript', tags: ['frontend', 'react'] },
    { id: '10', name: 'data-viz-library', owner: 'stark-industries', url: '', lastUpdated: '2 weeks ago', language: 'TypeScript', tags: ['dataviz', 'charts'] },
    { id: '11', name: 'e-commerce-storefront', owner: 'stark-industries', url: '', lastUpdated: '3 weeks ago', language: 'TypeScript', tags: ['frontend', 'e-commerce'] },
    { id: '12', name: 'realtime-chat-app', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'Go', tags: ['backend', 'websockets'] },
    { id: '13', name: 'iot-dashboard', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'TypeScript', tags: ['iot', 'dashboard'] },
    { id: '14', name: 'machine-learning-model', owner: 'wayne-enterprises', url: '', lastUpdated: '2 days ago', language: 'Python', tags: ['ml', 'ai'] },
    { id: '15', name: 'cybersecurity-toolkit', owner: 'wayne-enterprises', url: '', lastUpdated: '5 days ago', language: 'Rust', tags: ['security'] },
    { id: '16', name: 'cloud-storage-solution', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'Go', tags: ['backend', 'storage'] },
    { id: '17', name: 'mobile-game-engine', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'C++', tags: ['gaming', 'mobile'] },
    { id: '18', name: 'video-streaming-service', owner: 'globex-inc', url: '', lastUpdated: '3 weeks ago', language: 'Go', tags: ['backend', 'video'] },
    { id: '19', name: 'automated-testing-framework', owner: 'globex-inc', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['testing', 'devops'] },
    { id: '20', name: 'social-media-aggregator', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'JavaScript', tags: ['frontend', 'api'] },
    { id: '21', name: 'blogging-platform', owner: 'stark-industries', url: '', lastUpdated: '1 day ago', language: 'Go', tags: ['backend'] },
    { id: '22', name: 'devops-pipeline-manager', owner: 'wayne-enterprises', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['devops', 'ci-cd'] },
    { id: '23', name: 'graphql-server-template', owner: 'acme-corp', url: '', lastUpdated: '1 week ago', language: 'TypeScript', tags: ['backend', 'graphql'] },
    { id: '24', name: 'design-system-ui-kit', owner: 'acme-corp', url: '', lastUpdated: '2 weeks ago', language: 'TypeScript', tags: ['frontend', 'ui-kit'] },
    { id: '25', name: 'financial-analytics-tool', owner: 'wayne-enterprises', url: '', lastUpdated: '3 days ago', language: 'Python', tags: ['finance', 'analytics'] },
    { id: '26', name: 'collaboration-platform', owner: 'stark-industries', url: '', lastUpdated: '1 week ago', language: 'TypeScript', tags: ['collaboration', 'saas'] },
    { id: '27', name: 'log-management-system', owner: 'globex-inc', url: '', lastUpdated: '2 weeks ago', language: 'Go', tags: ['backend', 'logging'] },
    { id: '28', name: 'customer-support-chatbot', owner: 'acme-corp', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['chatbot', 'ai'] },
    { id: '29', name: 'healthcare-data-platform', owner: 'wayne-enterprises', url: '', lastUpdated: '5 days ago', language: 'Python', tags: ['healthcare', 'data'] },
    { id: '30', name: 'smart-home-controller', owner: 'stark-industries', url: '', lastUpdated: '2 weeks ago', language: 'Rust', tags: ['iot', 'smart-home'] },
    { id: '31', name: 'geospatial-analysis-api', owner: 'globex-inc', url: '', lastUpdated: '1 week ago', language: 'Go', tags: ['backend', 'gis'] },
    { id: '32', name: 'virtual-reality-sdk', owner: 'acme-corp', url: '', lastUpdated: '3 weeks ago', language: 'C++', tags: ['vr', 'sdk'] },
    { id: '33', name: 'code-review-assistant', owner: 'wayne-enterprises', url: '', lastUpdated: '4 days ago', language: 'Python', tags: ['dev-tools', 'ai'] },
    { id: '34', name: 'music-recommendation-engine', owner: 'stark-industries', url: '', lastUpdated: '1 month ago', language: 'Python', tags: ['ml', 'music'] },
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
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
                      <TableCell>{repo.lastUpdated}</TableCell>
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
