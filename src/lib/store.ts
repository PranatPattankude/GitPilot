
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
    merged?: boolean;
    state?: string;
    head: { sha: string };
}

export type BulkBuild = {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  repos: Build[];
  status: 'In Progress' | 'Success' | 'Failed';
  duration: string;
  timestamp: Date;
  user?: string;
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
  setBulkBuild: (build: BulkBuild | null) => void;
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
  setBulkBuild: (build) => set({ bulkBuild: build }),
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
