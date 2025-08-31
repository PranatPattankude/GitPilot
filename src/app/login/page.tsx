
"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GithubIcon, GitPilotLogo, GitBranchIcon, CodeBracketsIcon, GitCommitIcon } from "@/components/icons"
import { ThemeToggle } from "../dashboard/theme-toggle"
import { cn } from "@/lib/utils"

const AnimatedIcon = ({ icon: Icon, className, style }: { icon: React.FC<any>, className?: string, style?: React.CSSProperties }) => (
    <div className={cn("absolute text-primary/10 dark:text-primary/5 animate-float", className)} style={style}>
        <Icon className="size-full" />
    </div>
);

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-muted p-12 text-center relative overflow-hidden">
        
        {/* Animated Background Icons */}
        <AnimatedIcon icon={GitBranchIcon} className="size-32" style={{ top: '10%', left: '15%', animationDuration: '22s' }} />
        <AnimatedIcon icon={CodeBracketsIcon} className="size-24" style={{ top: '20%', right: '10%', animationDuration: '18s', animationDelay: '2s' }} />
        <AnimatedIcon icon={GitCommitIcon} className="size-28" style={{ bottom: '15%', left: '25%', animationDuration: '25s', animationDelay: '1s' }} />
        <AnimatedIcon icon={GitBranchIcon} className="size-20" style={{ bottom: '30%', right: '20%', animationDuration: '19s', animationDelay: '3s' }} />
        <AnimatedIcon icon={CodeBracketsIcon} className="size-16" style={{ top: '60%', left: '5%', animationDuration: '23s' }} />
        <AnimatedIcon icon={GitCommitIcon} className="size-20" style={{ top: '75%', right: '35%', animationDuration: '21s', animationDelay: '4s' }} />

        <div className="relative z-[1] flex flex-col items-center justify-center backdrop-blur-sm bg-muted/50 p-10 rounded-xl">
          <div className="flex items-center gap-4">
              <GitPilotLogo className="w-16 h-16 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">GitPilot</h1>
          </div>
          <p className="mt-4 text-lg text-muted-foreground">
              Merge branches, resolve conflicts, and track releases with ease.
          </p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-background">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your dashboard and manage your repositories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              >
                <GithubIcon className="mr-2 h-5 w-5" />
                Sign in with GitHub
              </Button>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
