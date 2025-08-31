
"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { GithubIcon, GitPilotLogo } from "@/components/icons"
import { ThemeToggle } from "../dashboard/theme-toggle"
import AnimatedBackground from "./animated-background"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gray-900 p-6 text-center">
      <AnimatedBackground />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        <div className="text-white">
          <h1 className="text-5xl font-bold tracking-tight">
            Welcome to GitPilot
          </h1>
        </div>
        <p className="text-lg text-white/80 max-w-2xl">
          The ultimate tool for managing your development workflow. Merge branches, resolve conflicts, and track releases with seamless ease.
        </p>
        <Button
          size="lg"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="transform transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
        >
          <GithubIcon className="mr-2 h-5 w-5" />
          Sign in with GitHub to Get Started
        </Button>
      </div>
    </div>
  )
}
