
"use client"

import { useState, useEffect } from "react"
import { GitMerge, GitPullRequest, AlertTriangle } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import ConflictResolver from "./conflict-resolver"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { addReleaseToHistory } from "@/ai/flows/release-history"
import { useToast } from "@/hooks/use-toast"

const conflictRepo = { id: '3', name: 'react-fire-hooks', owner: 'acme-corp', url: 'https://github.com/acme-corp/react-fire-hooks', lastUpdated: '5 minutes ago' };

export default function MergePage() {
  const { selectedRepos } = useAppStore()
  const [sourceBranch, setSourceBranch] = useState("feature/new-auth")
  const [targetBranch, setTargetBranch] = useState("main")
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonDone, setComparisonDone] = useState(false)
  const [isMerging, setIsMerging] = useState(false);
  const [isClient, setIsClient] = useState(false)
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleCompare = () => {
    setIsComparing(true)
    setTimeout(() => {
      setIsComparing(false)
      setComparisonDone(true)
    }, 1500)
  }
  
  const handleMerge = async () => {
    setIsMerging(true);
    try {
      // In a real scenario, we would filter to only mergeable repos.
      const reposToMerge = selectedRepos
        .filter(repo => !hasConflicts(repo.id))
        .map(repo => repo.name);
      
      if(reposToMerge.length > 0) {
        await addReleaseToHistory({
            type: reposToMerge.length > 1 ? 'bulk' : 'single',
            repos: reposToMerge,
            branch: `${sourceBranch} -> ${targetBranch}`,
            user: "guest@example.com", // In a real app, this would be the logged-in user.
            status: "Success", // This would come from the actual build result.
        });
        toast({
            title: "Merge Successful",
            description: "Release history has been updated in Google Sheets.",
        });
      }

      // Here you would typically trigger the actual merge process
      // For now, we'll just navigate to the build status page
      router.push("/dashboard/builds")
    } catch (error) {
        console.error("Failed to add release to history:", error);
        toast({
            variant: "destructive",
            title: "Merge Failed",
            description: "Could not update the release history.",
        });
    } finally {
        setIsMerging(false);
    }
  }

  const hasConflicts = (repoId: string) => comparisonDone && repoId === conflictRepo.id

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  if (selectedRepos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <GitMerge className="size-16 mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Repositories Selected</h2>
        <p className="text-muted-foreground mt-2">
          Please go back to the repositories page and select at least one repository to merge.
        </p>
        <Button onClick={() => router.push('/dashboard/repositories')} className="mt-4">
          Select Repositories
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Branch Merging</CardTitle>
          <CardDescription>
            Compare and merge branches across your selected repositories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="source-branch">Source Branch</Label>
              <Input
                id="source-branch"
                value={sourceBranch}
                onChange={(e) => setSourceBranch(e.target.value)}
                placeholder="e.g., feature/new-login"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-branch">Target Branch</Label>
              <Input
                id="target-branch"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                placeholder="e.g., main"
              />
            </div>
          </div>
          <Button onClick={handleCompare} disabled={isComparing}>
            {isComparing ? "Comparing..." : "Compare Branches"}
          </Button>
        </CardContent>
      </Card>

      {comparisonDone && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Result</CardTitle>
            <CardDescription>
              Review the status of each repository before proceeding with the merge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {selectedRepos.map((repo) => (
                <li key={repo.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{repo.name}</h3>
                      <p className="text-sm text-muted-foreground">{repo.owner}</p>
                    </div>
                    {hasConflicts(repo.id) ? (
                      <Badge variant="destructive" className="flex items-center gap-2">
                        <AlertTriangle className="size-4" />
                        Conflicts found
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/50">Can be merged cleanly</Badge>
                    )}
                  </div>
                  {hasConflicts(repo.id) && (
                    <>
                      <Separator className="my-4" />
                      <ConflictResolver />
                    </>
                  )}
                </li>
              ))}
            </ul>
             <div className="flex justify-end mt-6">
              <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleMerge} disabled={isMerging}>
                {isMerging ? "Merging..." : (
                    <>
                        <GitPullRequest className="mr-2 size-4" />
                        Merge All Clean Branches
                    </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
