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
import { useAppStore, type Repository } from "@/lib/store"
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"

async function fetchRepos(token: string): Promise<Repository[]> {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        console.error("Failed to fetch repos from GitHub, status:", response.status);
        throw new Error("Failed to fetch repos from GitHub");
    }

    const data = await response.json();
    return data.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        owner: repo.owner.login,
        url: repo.html_url,
        lastUpdated: new Date(repo.updated_at).toLocaleDateString(),
    }));
}


export default function RepositoriesPage() {
  const router = useRouter()
  const { selectedRepos, addRepo, removeRepo, setRepos: setGlobalRepos, clearRepos } = useAppStore()
  const [localRepos, setLocalRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = localStorage.getItem('github-token');
        if (token) {
          try {
            const userRepos = await fetchRepos(token);
            setLocalRepos(userRepos);
          } catch (e) {
            console.error("Could not fetch repos, logging out.", e);
            // Optional: maybe clear the token and log out if it's invalid
            localStorage.removeItem('github-token');
            auth.signOut();
          } finally {
            setLoading(false);
          }
        } else {
           // No token, redirect to login
           router.push('/login');
        }
      } else {
        router.push("/login")
      }
    })

    return () => {
      unsubscribe();
      clearRepos(); // Clear repo selection on unmount
    }
  }, [router, clearRepos])

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
                  Array.from({ length: 5 }).map((_, i) => (
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
      {selectedRepos.length > 0 && (
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
