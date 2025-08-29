
"use server"

import { getServerSession } from "next-auth/next"
import { type Repository, type Build } from "@/lib/store"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function fetchFromGitHub<T>(url: string, accessToken: string, options: RequestInit = {}): Promise<{ data: T, nextUrl: string | null }> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    // Revalidate every hour
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error(`GitHub API Error for ${url}:`, {
        status: response.status,
        message: errorData?.message,
    });
    
    if (response.status === 404) {
        return { data: [] as T, nextUrl: null };
    }
    const errorMessage = errorData?.message || `Failed to fetch data, status: ${response.status}`;
    
    if (response.status === 403 && errorMessage.includes('rate limit')) {
        throw new Error("GitHub API rate limit exceeded. Please try again later.");
    }
    
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

  const data = await response.json();
  return { data, nextUrl };
}


async function getRecentBuilds(repoFullName: string, accessToken: string): Promise<Build[]> {
    try {
        const url = `https://api.github.com/repos/${repoFullName}/actions/runs?per_page=20`;
        const { data: runsData } = await fetchFromGitHub<{ workflow_runs: any[] }>(url, accessToken);

        if (!runsData || !runsData.workflow_runs) {
            return [];
        }
        
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        return runsData.workflow_runs
            .filter(run => new Date(run.created_at) > twelveHoursAgo)
            .map((run: any): Build => {
                let status: Build['status'];
                if (run.status === 'in_progress' || run.status === 'queued' || run.status === 'requested' || run.status === 'waiting') {
                    status = 'In Progress';
                } else if (run.status === 'completed') {
                    if (run.conclusion === 'success') {
                        status = 'Success';
                    } else {
                        status = 'Failed';
                    }
                } else {
                    status = 'Failed';
                }
                
                return {
                    id: run.id.toString(),
                    branch: run.head_branch,
                    commit: run.head_sha.substring(0, 7),
                    status,
                    timestamp: new Date(run.created_at),
                };
            });
    } catch (error) {
        console.error(`Failed to fetch builds for ${repoFullName}:`, error);
        return [];
    }
}

async function getBranchesForRepo(repoFullName: string, accessToken: string): Promise<string[]> {
    try {
        let allBranches: any[] = [];
        let currentUrl: string | null = `https://api.github.com/repos/${repoFullName}/branches?per_page=100`;

        while (currentUrl) {
            const { data, nextUrl } = await fetchFromGitHub<any[]>(currentUrl, accessToken);
            allBranches = allBranches.concat(data);
            currentUrl = nextUrl;
        }
        
        return allBranches.map(branch => branch.name);
    } catch (error) {
        console.error(`Failed to fetch branches for ${repoFullName}:`, error);
        // Return a default list if fetching fails, e.g., for empty repos
        return ['main']; 
    }
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
      const { data, nextUrl } = await fetchFromGitHub<any[]>(currentUrl, accessToken);
      allRepos = allRepos.concat(data);
      currentUrl = nextUrl;
    }

    const reposWithDetails = await Promise.all(
        allRepos.map(async (repo) => {
            const [recentBuilds, branches] = await Promise.all([
                getRecentBuilds(repo.full_name, accessToken),
                getBranchesForRepo(repo.full_name, accessToken)
            ]);

            return {
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
                tags: [],
                recentBuilds, 
                branches,
                fullName: repo.full_name,
            };
        })
    );

    return reposWithDetails;

  } catch (error) {
    console.error("Error fetching repositories:", error)
    if (error instanceof Error && error.message.includes('GitHub API rate limit exceeded')) {
        throw error;
    }
    throw new Error("Could not fetch repositories from GitHub.");
  }
}

export async function getBuildsForRepo(repoFullName: string): Promise<Build[]> {
    const session = await getServerSession(authOptions)

    if (!session || !(session as any).accessToken) {
        throw new Error("Not authenticated")
    }

    const accessToken = (session as any).accessToken as string;

    try {
        const url = `https://api.github.com/repos/${repoFullName}/actions/runs?per_page=20`;
        const { data: runsData } = await fetchFromGitHub<{ workflow_runs: any[] }>(url, accessToken);

        if (!runsData || !runsData.workflow_runs) {
            return [];
        }
        
        return runsData.workflow_runs.map((run: any): Build => {
            let status: Build['status'];
            if (run.status === 'in_progress' || run.status === 'queued' || run.status === 'requested' || run.status === 'waiting') {
                status = 'In Progress';
            } else if (run.status === 'completed') {
                if (run.conclusion === 'success') {
                    status = 'Success';
                } else {
                    status = 'Failed';
                }
            } else {
                status = 'Failed';
            }
            
            return {
                id: run.id.toString(),
                branch: run.head_branch,
                commit: run.head_sha.substring(0, 7),
                status,
                timestamp: new Date(run.created_at),
                error: run.conclusion === 'failure' ? 'Build failed' : null,
            };
        });
    } catch (error) {
        console.error(`Failed to fetch builds for ${repoFullName}:`, error);
        throw new Error(`Could not fetch builds for ${repoFullName}.`);
    }
}

export async function updateRepoTags(repoId: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    // This is now a mock function.
    console.log(`(Mock) Updating tags for ${repoId}:`, tags);
    return { success: true };
  } catch (error) {
    console.error("Error in updateRepoTags server action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
