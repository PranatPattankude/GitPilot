"use client"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { getReleaseHistory, type Release } from "@/ai/flows/release-history"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      setLoading(true);
      try {
        const releaseData = await getReleaseHistory();
        setReleases(releaseData);
      } catch (error) {
        console.error("Failed to fetch release history:", error);
        // Handle error, maybe show a toast
      } finally {
        setLoading(false);
      }
    };
    fetchReleases();
  }, []);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Release History</CardTitle>
        <CardDescription>
          A log of all merges and releases triggered from GitPilot, stored in Google Sheets.
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
                <TableHead>Date</TableHead>
                <TableHead>Build Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))
              ) : releases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No release history found. Make sure your Google Sheet is set up correctly.
                  </TableCell>
                </TableRow>
              ) : (
                releases.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell className="font-medium">
                      {release.type === 'single' ? (
                        release.repos[0]
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="link" className="p-0 h-auto font-medium">
                              {release.repos?.length || 0} repositories
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Merged Repositories</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ScrollArea className="h-48">
                              {(release.repos || []).map(repo => (
                                <DropdownMenuItem key={repo} disabled>
                                  {repo}
                                </DropdownMenuItem>
                              ))}
                            </ScrollArea>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                    <TableCell>{release.branch}</TableCell>
                    <TableCell>{release.user}</TableCell>
                    <TableCell>{formatDate(release.timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant={release.status === 'Success' ? 'default' : 'destructive'} className={release.status === 'Success' ? 'bg-accent text-accent-foreground' : ''}>
                        {release.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
