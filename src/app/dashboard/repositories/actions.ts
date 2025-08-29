


"use server"

import { getServerSession } from "next-auth/next"
import { type Repository, type Build, type PullRequest } from "@/lib/store"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function fetchFromGitHub<T>(
  url: string, 
  accessToken: string, 
  options: RequestInit = {},
  returnText: boolean = false
): Promise<{ data: T | any, nextUrl: string | null, status: number }> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `token ${accessToken}`,
      Accept: returnText ? "application/vnd.github.diff" : "application/vnd.github.v3+json",
    },
    // Revalidate every hour
    next: { revalidate: 3600 },
  });

  const responseStatus = response.status;
  
  // For text responses (like diffs), handle them separately.
  if (returnText) {
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`GitHub API Error for ${url}:`, {
            status: response.status,
            message: errorText,
        });
        throw new Error(errorText || `Failed to fetch diff, status: ${response.status}`);
    }
    const textData = await response.text();
    return { data: textData, nextUrl: null, status: responseStatus };
  }
  
  // Handle JSON responses
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return { data: null as T, nextUrl: null, status: responseStatus };
  }

  const errorData = await response.json().catch(() => null);
  
  if (!response.ok) {
    console.error(`GitHub API Error for ${url}:`, {
        status: response.status,
        message: errorData?.message,
    });
    
    if ([422, 404, 409, 405].includes(response.status)) {
       return { data: errorData, nextUrl: null, status: responseStatus };
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

  return { data: errorData, nextUrl, status: responseStatus };
}


async function getRecentBuilds(repoFullName: string, accessToken: string): Promise<Build[]> {
    try {
        let allRuns: any[] = [];
        let currentUrl: string | null = `https://api.github.com/repos/${repoFullName}/actions/runs?per_page=100`;

        while (currentUrl) {
            const { data, nextUrl } = await fetchFromGitHub<{ workflow_runs: any[] }>(currentUrl, accessToken);
            if (data && data.workflow_runs) {
                allRuns = allRuns.concat(data.workflow_runs);
            }
            currentUrl = nextUrl;
        }

        if (!allRuns) {
            return [];
        }
        
        return allRuns.map((run: any): Build => {
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
                repo: repoFullName,
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

export async function getAllRecentBuilds(): Promise<Build[]> {
    const session = await getServerSession(authOptions)
    if (!session || !(session as any).accessToken) {
        throw new Error("Not authenticated")
    }
    const accessToken = (session as any).accessToken as string;

    try {
        let allRepos: any[] = [];
        let currentUrl: string | null = "https://api.github.com/user/repos?type=all&sort=pushed&per_page=100";

        while (currentUrl) {
            const { data, nextUrl } = await fetchFromGitHub<any[]>(currentUrl, accessToken);
            allRepos = allRepos.concat(data);
            currentUrl = nextUrl;
        }
        
        // We only want to check repos pushed to in the last 7 days.
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRepos = allRepos.filter(repo => new Date(repo.pushed_at) > sevenDaysAgo);

        const allBuildPromises = recentRepos.map(repo => getRecentBuilds(repo.full_name, accessToken));
        const allBuildsNested = await Promise.all(allBuildPromises);
        let allBuilds = allBuildsNested.flat();

        // Filter builds to be within the last 7 days as well
        allBuilds = allBuilds.filter(build => build.timestamp > sevenDaysAgo);

        // Sort by timestamp descending
        allBuilds.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        return allBuilds;

    } catch (error) {
        console.error("Error fetching all recent builds:", error);
        if (error instanceof Error && error.message.includes('GitHub API rate limit exceeded')) {
            throw error;
        }
        throw new Error("Could not fetch recent builds from GitHub.");
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

export async function createPullRequest(
  repoFullName: string,
  sourceBranch: string,
  targetBranch: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return { success: false, error: "Not authenticated" };
  }
  const accessToken = (session as any).accessToken as string;

  try {
    const url = `https://api.github.com/repos/${repoFullName}/pulls`;
    const { data, status } = await fetchFromGitHub<any>(url, accessToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `Merge ${sourceBranch} into ${targetBranch}`,
        head: sourceBranch,
        base: targetBranch,
        body: `Automated PR created by GitPilot to merge ${sourceBranch} into ${targetBranch}.`,
      }),
    });

    if (status === 201) {
      return { success: true, data };
    }

    if (status === 422) {
      const errorDetails = data?.errors?.[0]?.message || data?.message || "An unprocessable request was made.";
      if (errorDetails.includes("A pull request already exists")) {
        return { success: false, error: "A pull request for these branches already exists." };
      }
      if (errorDetails.includes("No commits between")) {
        return { success: false, error: "The source and target branches are identical. There is nothing to merge." };
      }
      return { success: false, error: `Could not create PR: ${errorDetails}` };
    }
    
    // This is for other non-OK statuses that were not thrown but are not successful either.
    if (status >= 400) {
        return { success: false, error: data?.message || `An unknown error occurred (status ${status}).` };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error(`Failed to create pull request for ${repoFullName}:`, error);
    return { success: false, error: `Failed to create pull request: ${error.message}` };
  }
}

export async function mergePullRequest(
  repoFullName: string,
  pullRequestNumber: number
): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).accessToken) {
        return { success: false, error: "Not authenticated" };
    }
    const accessToken = (session as any).accessToken as string;

    try {
        const url = `https://api.github.com/repos/${repoFullName}/pulls/${pullRequestNumber}/merge`;
        const { status, data } = await fetchFromGitHub<any>(url, accessToken, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                commit_title: `Merge PR #${pullRequestNumber} via GitPilot`,
                commit_message: `Merged by GitPilot.`,
                merge_method: "merge", // Can be 'merge', 'squash', or 'rebase'
            }),
        });

        if (status === 405) { // Method Not Allowed
            return { success: false, error: "Pull request is not mergeable. It may have conflicts or require checks to pass." };
        }

        if (status === 409) { // Conflict
             return { success: false, error: "Could not merge due to a conflict. Please resolve conflicts on GitHub." };
        }

        if (status >= 400) {
            return { success: false, error: data?.message || `Failed to merge, status: ${status}` };
        }

        return { success: true };
    } catch (error: any) {
        console.error(`Failed to merge pull request #${pullRequestNumber} for ${repoFullName}:`, error);
        return { success: false, error: `Failed to merge pull request: ${error.message}` };
    }
}

export async function compareBranches(
  repoFullName: string,
  sourceBranch: string,
  targetBranch: string
): Promise<{ status: "has-conflicts" | "no-changes" | "can-merge"; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return { status: "has-conflicts", error: "Not authenticated" };
  }
  const accessToken = (session as any).accessToken as string;

  try {
    const compareUrl = `https://api.github.com/repos/${repoFullName}/compare/${targetBranch}...${sourceBranch}`;
    const { data, status } = await fetchFromGitHub<any>(compareUrl, accessToken);
    
    if (status === 404) {
      const errorMessage = data?.message || "One of the branches was not found.";
      if (errorMessage.includes("No common ancestor")) {
        return { status: "has-conflicts", error: "Branches have no common history and cannot be compared." };
      }
      return { status: "has-conflicts", error: "One of the branches was not found. It may not exist in this repository." };
    }
    
    if (data.status === 'identical') {
      return { status: "no-changes" };
    }
    
    if (data.status === 'diverged' || data.status === 'ahead' || data.status === 'behind') {
      // This is an optimistic check. The PR creation will be the definitive test for mergeability.
      return { status: "can-merge" };
    }
    
    // Fallback for other scenarios, assume conflicts until proven otherwise.
    return { status: "has-conflicts", error: data.status ? `Unknown branch status: ${data.status}` : "Could not determine mergeability." };

  } catch (error: any) {
    console.error(`Failed to compare branches for ${repoFullName}:`, error);
     if (error.message && error.message.includes("No common ancestor")) {
        return { status: "has-conflicts", error: "Branches have no common history and cannot be compared." };
    }
    if (error.message && error.message.includes("Not Found")) {
      return { status: "has-conflicts", error: "One of the branches was not found. It may not exist in this repository." };
    }
    return { status: "has-conflicts", error: `Failed to compare branches: ${error.message}` };
  }
}

export async function getBuildLogs(
  repoFullName: string,
  runId: string
): Promise<{ [jobName: string]: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    throw new Error("Not authenticated");
  }
  const accessToken = (session as any).accessToken as string;

  try {
    // 1. Get the jobs for the workflow run
    const jobsUrl = `https://api.github.com/repos/${repoFullName}/actions/runs/${runId}/jobs`;
    const { data: jobsData, status: jobsStatus } = await fetchFromGitHub<{ jobs: any[] }>(jobsUrl, accessToken);
    
    if (jobsStatus !== 200 || !jobsData.jobs) {
      throw new Error(`Failed to fetch jobs for run ${runId}. Status: ${jobsStatus}`);
    }

    if (jobsData.jobs.length === 0) {
        return { "info": "No jobs found for this build run." };
    }

    // 2. Fetch logs for each job
    const logPromises = jobsData.jobs.map(async (job) => {
      const logsUrl = `https://api.github.com/repos/${repoFullName}/actions/jobs/${job.id}/logs`;
      const { data: logText, status: logStatus } = await fetchFromGitHub<string>(logsUrl, accessToken, {}, true);

      if (logStatus !== 200) {
        console.warn(`Could not fetch logs for job "${job.name}" (ID: ${job.id}). Status: ${logStatus}`);
        return { name: job.name, logs: `Could not retrieve logs for this job. Status: ${logStatus}` };
      }
      return { name: job.name, logs: logText };
    });

    const logsPerJob = await Promise.all(logPromises);

    // 3. Combine into a single object
    const allLogs: { [jobName: string]: string } = {};
    for (const jobLog of logsPerJob) {
      allLogs[jobLog.name] = jobLog.logs;
    }

    return allLogs;
  } catch (error: any) {
    console.error(`Failed to fetch build logs for ${repoFullName}, run ${runId}:`, error);
    throw new Error(`Failed to fetch build logs: ${error.message}`);
  }
}

async function getPullRequestsForRepo(repoFullName: string, accessToken: string): Promise<any[]> {
    let allPRs: any[] = [];
    let currentUrl: string | null = `https://api.github.com/repos/${repoFullName}/pulls?state=open&per_page=100`;

    while (currentUrl) {
        const { data, nextUrl } = await fetchFromGitHub<any[]>(currentUrl, accessToken);
        if (data) {
            allPRs = allPRs.concat(data);
        }
        currentUrl = nextUrl;
    }
    return allPRs;
}

export async function getConflictingPullRequests(): Promise<PullRequest[]> {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).accessToken) {
        throw new Error("Not authenticated");
    }
    const accessToken = (session as any).accessToken as string;

    try {
        let allRepos: any[] = [];
        let currentUrl: string | null = "https://api.github.com/user/repos?type=all&per_page=100";

        // 1. Get all repositories for the user
        while (currentUrl) {
            const { data, nextUrl } = await fetchFromGitHub<any[]>(currentUrl, accessToken);
            allRepos = allRepos.concat(data);
            currentUrl = nextUrl;
        }

        // 2. Fetch all open pull requests for each repo
        const allPRsPromises = allRepos.map(repo => getPullRequestsForRepo(repo.full_name, accessToken));
        const allPRsNested = await Promise.all(allPRsPromises);
        const allPRs = allPRsNested.flat();

        if (allPRs.length === 0) {
            return [];
        }

        // 3. Fetch the detailed view for each PR to get mergeability status
        const detailedPRsPromises = allPRs.map(pr => 
            fetchFromGitHub<any>(pr.url, accessToken)
        );
        const detailedPRsResults = await Promise.all(detailedPRsPromises);
        
        // 4. Filter for PRs with conflicts
        const conflictingPRs = detailedPRsResults
            .map(res => res.data)
            .filter(pr => pr && pr.mergeable_state === 'dirty'); // 'dirty' means there are conflicts

        return conflictingPRs.map((pr: any): PullRequest => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            url: pr.html_url,
            repoFullName: pr.head.repo.full_name,
            sourceBranch: pr.head.ref,
            targetBranch: pr.base.ref,
            mergeable_state: pr.mergeable_state,
        }));

    } catch (error: any) {
        console.error("Error fetching conflicting pull requests:", error);
        if (error instanceof Error && error.message.includes('rate limit')) {
            throw error;
        }
        throw new Error("Could not fetch conflicting pull requests from GitHub.");
    }
}


export async function getPullRequestDiff(repoFullName: string, prNumber: number): Promise<string> {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).accessToken) {
        throw new Error("Not authenticated");
    }
    const accessToken = (session as any).accessToken as string;
    
    const url = `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}`;
    
    const { data } = await fetchFromGitHub<string>(url, accessToken, {}, true);

    return data;
}
