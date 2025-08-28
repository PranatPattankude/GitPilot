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
  { id: 1, type: 'single', repo: 'gitpilot-ui', branch: 'feature/sidebar-v2', user: 'Jane Doe', timestamp: new Date('2023-10-26T10:00:00'), status: 'Success' },
  { id: 2, type: 'single', repo: 'firebase-functions-sdk', branch: 'fix/caching-issue', user: 'Jane Doe', timestamp: new Date('2023-10-26T09:30:00'), status: 'Success' },
  {
    id: 6,
    type: 'bulk',
    repos: ['gitpilot-ui', 'firebase-functions-sdk', 'project-phoenix', 'react-fire-hooks', 'quantum-leap-engine'],
    branch: 'feature/new-auth',
    user: 'Jane Doe',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    status: 'Success',
  },
  { id: 3, type: 'single', repo: 'project-phoenix', branch: 'hotfix/prod-login', user: 'John Smith', timestamp: new Date('2023-10-25T16:15:00'), status: 'Success' },
  { id: 4, type: 'single', repo: 'react-fire-hooks', branch: 'feature/new-auth', user: 'Jane Doe', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'Failed' },
  { id: 5, type: 'single', repo: 'quantum-leap-engine', branch: 'refactor/core-logic', user: 'Emily White', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'Success' },
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
                <TableHead>User</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Build Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell className="font-medium">
                    {release.type === 'single' ? (
                      release.repo
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(release.repos || []).map(repo => (
                          <Badge key={repo} variant="secondary" className="font-normal">{repo}</Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{release.branch}</TableCell>
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
