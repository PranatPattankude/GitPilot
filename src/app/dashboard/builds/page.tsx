import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader, Clock, GitCommit, GitMerge, GitPullRequest } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const builds = [
  { id: 1, repo: 'gitpilot-ui', branch: 'main', commit: 'a1b2c3d', status: 'Success', duration: '5m 32s' },
  { id: 2, repo: 'firebase-functions-sdk', branch: 'main', commit: 'e4f5g6h', status: 'Running', duration: '2m 15s' },
  { id: 3, repo: 'project-phoenix', branch: 'main', commit: 'i7j8k9l', status: 'Failed', duration: '1m 45s' },
  { id: 4, repo: 'react-fire-hooks', branch: 'main', commit: 'm0n1o2p', status: 'Success', duration: '8m 02s' },
]

const bulkBuild = {
  id: 5,
  sourceBranch: 'feature/new-auth',
  targetBranch: 'main',
  repos: [
    { name: 'gitpilot-ui', status: 'Success' },
    { name: 'firebase-functions-sdk', status: 'Success' },
    { name: 'project-phoenix', status: 'In Progress' },
    { name: 'react-fire-hooks', status: 'Success' },
    { name: 'quantum-leap-engine', status: 'Failed' },
    { name: 'nomad-travel-app', status: 'Success' },
    { name: 'recipe-finder-api', status: 'Success' },
    { name: 'crypto-tracker', status: 'Queued' },
    { name: 'portfolio-generator', status: 'Queued' },
    { name: 'data-viz-library', status: 'Queued' },
  ],
  status: 'In Progress',
  duration: '1m 10s',
}

const statusInfo = {
  Success: { icon: CheckCircle2, color: "text-accent" },
  Failed: { icon: XCircle, color: "text-destructive" },
  Running: { icon: Loader, color: "text-primary", animation: "animate-spin" },
  "In Progress": { icon: Loader, color: "text-primary", animation: "animate-spin" },
  Queued: { icon: Clock, color: "text-muted-foreground" },
}

export default function BuildsPage() {
  return (
    <>
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Build Status</h1>
        <p className="text-muted-foreground mt-1">Live status of your CI/CD pipelines.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card key={bulkBuild.id} className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <GitMerge className="size-5" />
                Bulk Build
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{bulkBuild.repos.length} repositories</span>
                {(() => {
                  const Info = statusInfo[bulkBuild.status as keyof typeof statusInfo]
                  if (!Info) return null
                  const { icon: Icon, color, animation } = Info
                  return <Icon className={`size-6 ${color} ${animation || ''}`} />
                })()}
              </div>
            </div>
            <CardDescription className="flex items-center gap-2">
              Merging <Badge variant="secondary">{bulkBuild.sourceBranch}</Badge> into <Badge variant="secondary">{bulkBuild.targetBranch}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span>{bulkBuild.duration}</span>
            </div>
            <Separator />
            <h4 className="font-medium">Repository Statuses</h4>
            <ScrollArea className="h-48">
              <ul className="space-y-2 pr-4">
                {bulkBuild.repos.map((repo) => {
                  const Info = statusInfo[repo.status as keyof typeof statusInfo]
                  if (!Info) return null;
                   const { icon: Icon, color, animation } = Info
                   return (
                      <li key={repo.name} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                        <span>{repo.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${color}`}>{repo.status}</span>
                          <Icon className={`size-4 ${color} ${animation || ''}`} />
                        </div>
                      </li>
                   )
                })}
              </ul>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">View Bulk Log</Button>
          </CardFooter>
        </Card>
        {builds.map((build) => {
          const SvgIcon = statusInfo[build.status as keyof typeof statusInfo]?.icon
          const color = statusInfo[build.status as keyof typeof statusInfo]?.color
          const animation = statusInfo[build.status as keyof typeof statusInfo]?.animation
          if (!SvgIcon) return null;

          return (
            <Card key={build.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{build.repo}</CardTitle>
                  <SvgIcon className={`size-6 ${color} ${animation}`} />
                </div>
                <CardDescription>Branch: {build.branch}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <GitCommit className="size-4 text-muted-foreground" />
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {build.commit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{build.duration}</span>
                </div>
              </CardContent>
              <CardFooter>
                 <Button variant="outline" size="sm">View Logs</Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </>
  )
}
