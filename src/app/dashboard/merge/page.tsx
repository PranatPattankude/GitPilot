
"use client"

import { useAppStore } from "@/lib/store";
import { AlertTriangle, CheckCircle, FileText, Zap, ChevronRight, GitBranch } from "lucide-react"
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import ConflictResolver from "./conflict-resolver";

const summaryCards = [
  { title: "Total Conflicts", value: 3, icon: AlertTriangle, color: "text-destructive" },
  { title: "Resolved", value: 1, icon: CheckCircle, color: "text-green-500" },
  { title: "Files Affected", value: 2, icon: FileText, color: "text-blue-500" },
  { title: "Auto-Resolvable", value: 0, icon: Zap, color: "text-yellow-500" },
]

const conflictGroups = [
    {
        repo: "web-application",
        sourceBranch: "feature/auth-improvements",
        targetBranch: "develop",
        priority: "High Priority",
        timestamp: "15/01/2024, 14:30:00",
        filesAffected: 2,
        totalConflicts: 3,
        files: [
            { name: "src/auth/loginService.ts", priority: "high", status: "unresolved", conflicts: 2 },
            { name: "src/components/LoginForm.tsx", priority: "medium", status: "resolved", conflicts: 1 },
        ]
    }
]


export default function MergePage() {
    const { setSearchQuery } = useAppStore();

    React.useEffect(() => {
      // Clear search when navigating to this page
      setSearchQuery('');
    }, [setSearchQuery]);

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Conflict Resolution</h1>
        <p className="text-muted-foreground mt-1">Intelligent merge conflict detection and resolution across repositories.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(card => (
            <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="space-y-4">
        {conflictGroups.map(group => (
            <Card key={group.repo}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <h2 className="text-xl font-semibold">{group.repo}</h2>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <GitBranch className="h-4 w-4" />
                                <Badge variant="secondary">{group.sourceBranch}</Badge>
                                <span>→</span>
                                <Badge variant="secondary">{group.targetBranch}</Badge>
                            </div>
                             <p className="text-sm text-muted-foreground mt-2">{group.filesAffected} files affected • {group.totalConflicts} conflicts total</p>
                        </div>
                        <div className="text-right">
                            <Badge variant="destructive">{group.priority}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">{group.timestamp}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                       {group.files.map(file => (
                           <AccordionItem value={file.name} key={file.name}>
                               <AccordionTrigger>
                                   <div className="flex items-center justify-between w-full">
                                       <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span>{file.name}</span>
                                            <Badge variant={file.priority === 'high' ? 'destructive' : 'secondary'}>{file.priority}</Badge>
                                            {file.status === 'resolved' && <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">✓ Resolved</Badge>}
                                       </div>
                                       <div className="text-sm text-muted-foreground pr-4">{file.conflicts} conflict{file.conflicts > 1 ? 's' : ''}</div>
                                   </div>
                               </AccordionTrigger>
                               <AccordionContent>
                                   <ConflictResolver />
                               </AccordionContent>
                           </AccordionItem>
                       ))}
                    </Accordion>
                </CardContent>
            </Card>
        ))}
      </div>

    </div>
  )
}
