
"use server"

import { getServerSession } from "next-auth/next"
import { type Repository } from "@/lib/store"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getRepositories(): Promise<Repository[]> {
  const session = await getServerSession(authOptions)

  if (!session || !(session as any).accessToken) {
    throw new Error("Not authenticated")
  }

  const accessToken = (session as any).accessToken as string;
  const url = "https://api.github.com/user/repos?type=all&sort=updated&per_page=100"

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      // Revalidate every hour
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("GitHub API Error:", errorData);
      const errorMessage = errorData?.message || `Failed to fetch data, status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const data: any[] = await response.json();

    // Here we can map the complex GitHub API response to our simpler Repository type.
    // We also add a few properties that are not on the GitHub response, like tags and recentBuilds.
    return data.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
      html_url: repo.html_url,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      updated_at: repo.updated_at,
      // Add empty fields for data not on the GitHub API response
      tags: [],
      recentBuilds: [], 
      branches: [], // We can fetch this separately if needed
    }));

  } catch (error) {
    console.error("Error fetching repositories:", error)
    if (error instanceof Error && error.message.includes('API rate limit exceeded')) {
        throw new Error("GitHub API rate limit exceeded. Please try again later.");
    }
    throw new Error("Could not fetch repositories from GitHub.");
  }
}
