
"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GithubIcon, GitPilotLogo } from "@/components/icons"
import { ThemeToggle } from "../dashboard/theme-toggle"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-muted p-12 text-center relative overflow-hidden">
        <Image 
          src="https://picsum.photos/1200/1800"
          alt="Abstract DevOps background"
          data-ai-hint="devops futuristic"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-blue-900/50 opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center backdrop-blur-md bg-background/30 p-10 rounded-xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-4">
              <GitPilotLogo className="w-16 h-16 text-white" />
              <h1 className="text-4xl font-bold tracking-tight text-white">GitPilot</h1>
          </div>
          <p className="mt-4 text-lg text-white/80">
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
