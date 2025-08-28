import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader, Clock, GitCommit } from "lucide-react"
import { Button } from "@/components/ui/button"

const builds = [
  { id: 1, repo: 'gitpilot-ui', branch: 'main', commit: 'a1b2c3d', status: 'Success', duration: '5m 32s' },
  { id: 2, repo: 'firebase-functions-sdk', branch: 'main', commit: 'e4f5g6h', status: 'Running', duration: '2m 15s' },
  { id: 3, repo: 'project-phoenix', branch: 'main', commit: 'i7j8k9l', status: 'Failed', duration: '1m 45s' },
  { id: 4, repo: 'react-fire-hooks', branch: 'main', commit: 'm0n1o2p', status: 'Success', duration: '8m 02s' },
]

const statusInfo = {
  Success: { icon: CheckCircle2, color: "text-accent" },
  Failed: { icon: XCircle, color: "text-destructive" },
  Running: { icon: Loader, color: "text-primary", animation: "animate-spin" },
}

export default function BuildsPage() {
  return (
    <>
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Build Status</h1>
        <p className="text-muted-foreground mt-1">Live status of your CI/CD pipelines.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {builds.map((build) => {
          const { icon: Icon, color, animation } = statusInfo[build.status as keyof typeof statusInfo]
          return (
            <Card key={build.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{build.repo}</CardTitle>
                  <Icon className={`size-6 ${color} ${animation}`} />
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
