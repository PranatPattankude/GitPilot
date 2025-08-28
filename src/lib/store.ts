"use client"

import { create } from 'zustand'

export type Build = {
  status: 'In Progress' | 'Success' | 'Failed';
}

export type Repository = {
  id: string
  name: string
  owner: string
  url: string
  lastUpdated: string
  language: string;
  tags: string[];
  stars: number;
  forks: number;
  openIssues: number;
  pullRequests: number;
  contributors: number;
  recentBuild: Build;
  branches?: string[];
}

type AppState = {
  selectedRepos: Repository[]
  addRepo: (repo: Repository) => void
  removeRepo: (repoId: string) => void
  setRepos: (repos: Repository[]) => void
  clearRepos: () => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedRepos: [],
  addRepo: (repo) => set((state) => ({ selectedRepos: [...state.selectedRepos, repo] })),
  removeRepo: (repoId) => set((state) => ({ selectedRepos: state.selectedRepos.filter((r) => r.id !== repoId) })),
  setRepos: (repos) => set({ selectedRepos: repos }),
  clearRepos: () => set({ selectedRepos: [] }),
}))
