"use client"

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge"
import { useAppStore, type Repository } from "@/lib/store"
import { useEffect, useState } from "react"

const mockRepos: Repository[] = [
  { id: '1', name: 'gitpilot-ui', owner: 'firebase', url: 'https://github.com/firebase/gitpilot-ui', lastUpdated: '2 hours ago' },
  { id: '2', name: 'firebase-functions-sdk', owner: 'firebase', url: 'https://github.com/firebase/firebase-functions-sdk', lastUpdated: '1 day ago' },
  { id: '3', name: 'react-fire-hooks', owner: 'acme-corp', url: 'https://github.com/acme-corp/react-fire-hooks', lastUpdated: '5 minutes ago' },
  { id: '4', name: 'project-phoenix', owner: 'acme-corp', url: 'https://github.com/acme-corp/project-phoenix', lastUpdated: '3 days ago' },
  { id: '5', name: 'quantum-leap-engine', owner: 'innovate-ch', url: 'https://github.com/innovate-ch/quantum-leap-engine', lastUpdated: '1 week ago' },
]

export default function RepositoriesPage() {
  const router = useRouter()
  const { selectedRepos, addRepo, removeRepo, setRepos } = useAppStore()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSelectRepo = (repo: Repository) => {
    if (selectedRepos.some((r) => r.id === repo.id)) {
      removeRepo(repo.id)
    } else {
      addRepo(repo)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setRepos(mockRepos)
    } else {
      setRepos([])
    }
  }
  
  const isAllSelected = isClient && mockRepos.length > 0 && selectedRepos.length === mockRepos.length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Repositories</CardTitle>
          <CardDescription>
            Select repositories to perform bulk operations like merging branches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      onCheckedChange={handleSelectAll} 
                      checked={isAllSelected}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRepos.map((repo) => (
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {isClient && selectedRepos.length > 0 && (
        <div className="flex justify-end space-x-4">
          <p className="self-center text-sm text-muted-foreground">{selectedRepos.length} repositories selected</p>
          <Button onClick={() => router.push('/dashboard/merge')}>
            Proceed to Merge
          </Button>
        </div>
      )}
    </div>
  )
}
