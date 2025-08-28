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
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'

const releases = [
  { id: 1, repo: 'gitpilot-ui', branch: 'feature/sidebar-v2', commit: 'a1b2c3d', user: 'Jane Doe', timestamp: new Date('2023-10-26T10:00:00'), status: 'Success' },
  { id: 2, repo: 'firebase-functions-sdk', branch: 'fix/caching-issue', commit: 'e4f5g6h', user: 'Jane Doe', timestamp: new Date('2023-10-26T09:30:00'), status: 'Success' },
  { id: 3, repo: 'project-phoenix', branch: 'hotfix/prod-login', commit: 'i7j8k9l', user: 'John Smith', timestamp: new Date('2023-10-25T16:15:00'), status: 'Success' },
  { id: 4, repo: 'react-fire-hooks', branch: 'feature/new-auth', commit: 'm0n1o2p', user: 'Jane Doe', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'Failed' },
  { id: 5, repo: 'quantum-leap-engine', branch: 'refactor/core-logic', commit: 'q3r4s5t', user: 'Emily White', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'Success' },
]

const formatTimestamp = (date: Date) => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now.getTime() - date.getTime() < oneDay) {
        return `${formatDistanceToNow(date)} ago`;
    }
    return date.toLocaleString();
}

export default function ReleasesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Release History</CardTitle>
        <CardDescription>
          A log of all merges and releases triggered from GitPilot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>Branch Merged</TableHead>
                <TableHead>Commit</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Build Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell className="font-medium">{release.repo}</TableCell>
                  <TableCell>{release.branch}</TableCell>
                  <TableCell><code className="text-sm bg-muted p-1 rounded">{release.commit}</code></TableCell>
                  <TableCell>{release.user}</TableCell>
                  <TableCell>{formatTimestamp(release.timestamp)}</TableCell>
                  <TableCell>
                    <Badge variant={release.status === 'Success' ? 'default' : 'destructive'} className={release.status === 'Success' ? 'bg-accent text-accent-foreground' : ''}>
                      {release.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

    