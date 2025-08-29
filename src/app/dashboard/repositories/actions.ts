
"use server"

import { getServerSession } from "next-auth/next"
import { type Repository } from "@/lib/store"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function fetchRepositories(url: string, accessToken: string): Promise<{ repos: any[], nextUrl: string | null }> {
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    // Revalidate every hour
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error("GitHub API Error:", errorData);
    const errorMessage = errorData?.message || `Failed to fetch data, status: ${response.status}`;
    throw new Error(errorMessage);
  }

  const linkHeader = response.headers.get("Link");
  let nextUrl: string | null = null;

  if (linkHeader) {
    const links = linkHeader.split(", ");
    const nextLink = links.find((link) => link.endsWith('rel="next"'));
    if (nextLink) {
      nextUrl = nextLink.substring(nextLink.indexOf('<') + 1, nextLink.indexOf('>'));
    }
  }

  const repos = await response.json();
  return { repos, nextUrl };
}

export async function getRepositories(): Promise<Repository[]> {
  const session = await getServerSession(authOptions)

  if (!session || !(session as any).accessToken) {
    throw new Error("Not authenticated")
  }

  const accessToken = (session as any).accessToken as string;
  let allRepos: any[] = [];
  let currentUrl: string | null = "https://api.github.com/user/repos?type=all&per_page=100";

  try {
    while (currentUrl) {
      const { repos, nextUrl } = await fetchRepositories(currentUrl, accessToken);
      allRepos = allRepos.concat(repos);
      currentUrl = nextUrl;
    }

    // Here we can map the complex GitHub API response to our simpler Repository type.
    // We also add a few properties that are not on the GitHub response, like tags and recentBuilds.
    return allRepos.map(repo => ({
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
