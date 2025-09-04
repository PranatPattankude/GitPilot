
"use client"

import { useState, useMemo, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle, XCircle, Loader, Monitor } from "lucide-react"

// Mock data - replace with actual API calls to your Kubernetes cluster
const mockNamespaces = {
  "production": [
    { name: "frontend-deployment-5d7f8f7c9-abcde", status: "Running", image: "nginx:1.21.6" },
    { name: "backend-api-deployment-6f8g9h0d1-fghij", status: "Running", image: "node:18-alpine" },
    { name: "database-statefulset-0", status: "Running", image: "postgres:14" },
  ],
  "staging": [
    { name: "feature-x-frontend-deployment-a1b2c3d4e-klmno", status: "Running", image: "nginx:latest" },
    { name: "feature-x-backend-api-deployment-b2c3d4e5f-pqrst", status: "Running", image: "node:20-alpine" },
  ],
  "monitoring": [
    { name: "prometheus-server-0", status: "Running", image: "prom/prometheus:v2.37.0" },
    { name: "grafana-deployment-7d8e9f0a1-uvwxy", status: "Running", image: "grafana/grafana:9.2.5" },
    { name: "loki-statefulset-0", status: "Error", image: "grafana/loki:2.7.1" },
  ],
  "default": [
      { name: "some-utility-pod-c4d5e6f7g-zabcd", status: "Completed", image: "busybox:1.35"}
  ]
}

type Pod = {
  name: string
  status: "Running" | "Error" | "Completed" | "Pending"
  image: string
}

const PodStatusIcon = ({ status }: { status: Pod['status'] }) => {
  switch (status) {
    case 'Running':
      return <CheckCircle className="size-4 text-accent" />;
    case 'Error':
      return <XCircle className="size-4 text-destructive" />;
    case 'Pending':
      return <Loader className="size-4 animate-spin text-primary" />;
    default:
      return <CheckCircle className="size-4 text-muted-foreground" />;
  }
}

export default function ObservabilityPage() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const [grafanaUrl, setGrafanaUrl] = useState("https://your-grafana.example.com");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Clear search on page load
    setSearchQuery('');
  }, [setSearchQuery]);

  const filteredNamespaces = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return mockNamespaces;

    return Object.entries(mockNamespaces).reduce((acc, [ns, pods]) => {
      if (ns.toLowerCase().includes(query)) {
        acc[ns] = pods;
      }
      return acc;
    }, {} as typeof mockNamespaces);
  }, [searchQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would handle authentication here.
    // For this placeholder, we'll just simulate a login.
    setIsLoggedIn(true);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Kubernetes Observability</h1>
        <p className="text-muted-foreground mt-1">
          View cluster status and access your Grafana dashboards.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cluster Overview</CardTitle>
              <CardDescription>
                Live status of pods running across all monitored namespaces.
              </CardDescription>
            </CardHeader>
            <CardContent>
                {Object.entries(filteredNamespaces).length > 0 ? (
                    Object.entries(filteredNamespaces).map(([ns, pods]) => (
                        <div key={ns} className="mb-6 last:mb-0">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <Monitor className="size-5 text-primary" />
                                Namespace: <Badge variant="secondary">{ns}</Badge>
                            </h3>
                             <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pod Name</TableHead>
                                            <TableHead>Container Image</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pods.map(pod => (
                                            <TableRow key={pod.name}>
                                                <TableCell className="font-mono text-xs">{pod.name}</TableCell>
                                                <TableCell className="font-mono text-xs">{pod.image}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <PodStatusIcon status={pod.status as Pod['status']} />
                                                        <span className="text-sm">{pod.status}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No namespaces found matching your search.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Grafana Access</CardTitle>
              <CardDescription>
                Log in to view your monitoring dashboards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoggedIn ? (
                <div className="space-y-4">
                  <p className="text-sm text-accent-foreground p-3 bg-accent/20 rounded-md flex items-center gap-2">
                    <CheckCircle className="size-4" />
                    You are logged in.
                  </p>
                  <a href={grafanaUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full">
                      <ExternalLink className="mr-2 size-4" />
                      Open Grafana
                    </Button>
                  </a>
                   <Button variant="secondary" className="w-full" onClick={() => setIsLoggedIn(false)}>
                      Log Out
                    </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="grafana-url">Grafana URL</Label>
                    <Input id="grafana-url" value={grafanaUrl} onChange={(e) => setGrafanaUrl(e.target.value)} placeholder="https://your-grafana.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grafana-user">Username</Label>
                    <Input id="grafana-user" placeholder="admin" autoComplete="username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grafana-pass">Password</Label>
                    <Input id="grafana-pass" type="password" placeholder="••••••••" autoComplete="current-password" />
                  </div>
                  <Button type="submit" className="w-full">Log In</Button>
                </form>
              )}
            </CardContent>
             <CardFooter>
                 <p className="text-xs text-muted-foreground">
                    This is a placeholder. In a real app, you would integrate with your authentication provider (e.g., OAuth).
                </p>
             </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

    