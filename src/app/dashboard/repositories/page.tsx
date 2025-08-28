"use client"

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

const staticRepos: Repository[] = [
    { id: '1', name: 'gitpilot-ui', owner: 'acme-corp', url: '', lastUpdated: '2 days ago' },
    { id: '2', name: 'firebase-functions-sdk', owner: 'acme-corp', url: '', lastUpdated: '3 days ago' },
    { id: '3', name: 'react-fire-hooks', owner: 'acme-corp', url: '', lastUpdated: '5 days ago' },
    { id: '4', name: 'project-phoenix', owner: 'acme-corp', url: '', lastUpdated: '1 week ago' },
];


export default function RepositoriesPage() {
  const router = useRouter()
  const { selectedRepos, addRepo, removeRepo, setRepos: setGlobalRepos, clearRepos } = useAppStore()
  const [localRepos, setLocalRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)

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
      setGlobalRepos(localRepos)
    } else {
      clearRepos()
    }
  }
  
  const isAllSelected = localRepos.length > 0 && selectedRepos.length === localRepos.length
  const isIndeterminate = selectedRepos.length > 0 && selectedRepos.length < localRepos.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Repository Management</h1>
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span>{localRepos.length} repositories • {selectedRepos.length} selected</span>
            )}
          </div>
        </div>
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg">
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
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2 mt-1" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-2/3" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  localRepos.map((repo) => (
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
                      <TableCell>{repo.lastUpdated}</TableCell>
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
