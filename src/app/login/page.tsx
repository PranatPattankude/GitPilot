"use client"

import { Github } from "lucide-react"
import { signInWithPopup, GithubAuthProvider } from "firebase/auth"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth, githubProvider } from "@/lib/firebase"
import { GitPilotLogo } from "@/components/icons"

export default function LoginPage() {
  const router = useRouter()

  const handleGitHubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider)
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token) {
        // In a real app, you would probably want to store the token securely,
        // maybe in an http-only cookie. For this demo, we'll use localStorage.
        localStorage.setItem('github-token', token);
        router.push("/dashboard")
      } else {
        throw new Error("Could not retrieve GitHub access token.");
      }

    } catch (error) {
      console.error("Authentication failed:", error)
      // You can display an error message to the user here.
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <GitPilotLogo className="size-10" />
          </div>
          <CardTitle className="text-2xl">Welcome to GitPilot</CardTitle>
          <CardDescription>
            Sign in to manage your repositories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={handleGitHubLogin}
          >
            <Github className="mr-2 size-5" />
            Sign in with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
