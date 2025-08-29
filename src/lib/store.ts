
"use client"

import { create } from 'zustand'

export type Build = {
  id: string;
  status: 'In Progress' | 'Success' | 'Failed' | 'Queued';
  timestamp: Date;
  branch: string;
  commit: string;
  error?: string | null;
  duration?: string;
  name?: string;
  repo?: string;
}

export type Repository = {
  id: string
  name: string
  owner: {
    login: string
    avatar_url: string
  }
  html_url: string
  description: string | null
  private: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  updated_at: string
  tags: string[]
  recentBuilds: Build[]
  branches: string[]
  fullName: string
}

export type ChangedFile = {
    sha: string;
    filename: string;
    status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
    additions: number;
    deletions: number;
    changes: number;
};


export type PullRequest = {
    id: number;
    number: number;
    title: string;
    url: string;
    repoFullName: string;
    sourceBranch: string;
    targetBranch: string;
    mergeable_state: string;
    conflictingFiles?: ChangedFile[];
}

export type BulkBuild = {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  repos: Build[];
  status: 'In Progress' | 'Success' | 'Failed';
  duration: string;
  timestamp: Date;
}

type AppState = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRepos: Repository[]
  addRepo: (repo: Repository) => void
  removeRepo: (repoId: string) => void
  setRepos: (repos: Repository[]) => void
  clearRepos: () => void
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  bulkBuild: BulkBuild | null;
  startBulkBuild: (build: BulkBuild) => void;
  updateBulkBuildRepoStatus: (repoName: string, status: Build['status'], duration: string) => void;
  finishBulkBuild: (status: BulkBuild['status']) => void;
  clearBulkBuild: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedRepos: [],
  addRepo: (repo) => set((state) => ({ selectedRepos: [...state.selectedRepos, repo] })),
  removeRepo: (repoId) => set((state) => ({ selectedRepos: state.selectedRepos.filter((r) => r.id !== repoId) })),
  setRepos: (repos) => set({ selectedRepos: repos }),
  clearRepos: () => set({ selectedRepos: [] }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  bulkBuild: null,
  startBulkBuild: (build) => set({ bulkBuild: build }),
  updateBulkBuildRepoStatus: (repoName, status, duration) => {
    const currentBuild = get().bulkBuild;
    if (currentBuild) {
      set({
        bulkBuild: {
          ...currentBuild,
          repos: currentBuild.repos.map(repo => 
            repo.name === repoName ? { ...repo, status, duration, timestamp: new Date() } : repo
          ),
        },
      });
    }
  },
  finishBulkBuild: (status) => {
      const currentBuild = get().bulkBuild;
      if (currentBuild) {
          const startTime = currentBuild.timestamp.getTime();
          const endTime = new Date().getTime();
          const durationSeconds = Math.round((endTime - startTime) / 1000);
          set({
              bulkBuild: {
                  ...currentBuild,
                  status,
                  duration: `${durationSeconds}s`
              }
          });
      }
  },
  clearBulkBuild: () => set({ bulkBuild: null }),
}))
