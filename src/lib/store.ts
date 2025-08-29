
"use client"

import { create } from 'zustand'

export type Build = {
  status: 'In Progress' | 'Success' | 'Failed';
  timestamp: Date;
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
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedRepos: [],
  addRepo: (repo) => set((state) => ({ selectedRepos: [...state.selectedRepos, repo] })),
  removeRepo: (repoId) => set((state) => ({ selectedRepos: state.selectedRepos.filter((r) => r.id !== repoId) })),
  setRepos: (repos) => set({ selectedRepos: repos }),
  clearRepos: () => set({ selectedRepos: [] }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
