
"use client"

import { create } from 'zustand'

export type Build = {
  id: string;
  status: 'In Progress' | 'Success' | 'Failed' | 'Queued' | 'Cancelled';
  timestamp: Date;
  branch: string;
  commit: string;
  triggeredBy?: string;
  error?: string | null;
  duration?: string;
  name?: string;
  repo?: string;
  prUrl?: string;
  prNumber?: number;
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
  created_at: string
  tags: string[]
  recentBuilds?: Build[]
  branches?: string[]
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
    created_at: Date;
}

export type BulkBuild = {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  repos: Build[];
  status: 'In Progress' | 'Success' | 'Failed';
  duration: string;
  timestamp: Date;
  triggeredBy?: string;
}

export type AppNotification = {
  id: string;
  type: 'repo' | 'build' | 'pr';
  message: string;
  timestamp: Date;
  repoFullName: string;
  url?: string;
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
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id'>) => void;
  addNotifications: (notifications: Omit<AppNotification, 'id'>[]) => void;
  clearNotifications: () => void;
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
  notifications: [],
  addNotification: (notification) => {
    const newNotification: AppNotification = {
        ...notification,
        id: `${notification.repoFullName}-${notification.type}-${notification.timestamp.getTime()}`,
    };
    set(state => ({ notifications: [newNotification, ...state.notifications] }));
  },
  addNotifications: (notifications) => {
    const newNotifications: AppNotification[] = notifications.map(n => ({
      ...n,
      id: `${n.repoFullName}-${n.type}-${n.timestamp.getTime()}-${Math.random()}`,
    }));
    set(state => ({ notifications: [...newNotifications, ...state.notifications] }));
  },
  clearNotifications: () => set({ notifications: [] }),
}))
