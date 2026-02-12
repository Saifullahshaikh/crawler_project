"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

type ScrapedDataItem = {
  url: string
  title: string
  description: string
  timestamp: string
  data: {
    headings: string[]
    links: string[]
    images: string[]
    text?: string
    metaTags?: Record<string, string>
  }
}

type HistoryItem = {
  id: string
  timestamp: string
  urls: string[]
}

type SavedDataItem = {
  id: string
  timestamp: string
  data: ScrapedDataItem[]
}

// Default URLs to pre-populate
const DEFAULT_SAVED_URLS = [
  "https://www.nyjacket.com/",
]

interface ScrapingState {
  currentData: ScrapedDataItem[]
  history: HistoryItem[]
  savedData: SavedDataItem[]
  savedUrls: string[]
  addScrapedData: (data: ScrapedDataItem[]) => void
  saveData: () => void
  removeFromHistory: (id: string) => void
  removeSavedData: (id: string) => void
  addSavedUrl: (url: string) => void
  removeSavedUrl: (url: string) => void
  initializeDefaultUrls: () => void
}

export const useScrapingStore = create<ScrapingState>()(
  persist(
    (set, get) => ({
      currentData: [],
      history: [],
      savedData: [],
      savedUrls: [],

      addScrapedData: (data: ScrapedDataItem[]) => {
        set((state) => {
          // Create a history item
          const historyItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            urls: data.map((item) => item.url),
          }

          return {
            currentData: data,
            history: [historyItem, ...state.history],
          }
        })
      },

      saveData: () => {
        set((state) => {
          if (state.currentData.length === 0) return state

          const savedItem: SavedDataItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            data: state.currentData,
          }

          return {
            savedData: [savedItem, ...state.savedData],
          }
        })
      },

      removeFromHistory: (id: string) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }))
      },

      removeSavedData: (id: string) => {
        set((state) => ({
          savedData: state.savedData.filter((item) => item.id !== id),
        }))
      },

      addSavedUrl: (url: string) => {
        set((state) => {
          if (!state.savedUrls.includes(url)) {
            return {
              savedUrls: [...state.savedUrls, url],
            }
          }
          return state
        })
      },

      removeSavedUrl: (url: string) => {
        set((state) => ({
          savedUrls: state.savedUrls.filter((savedUrl) => savedUrl !== url),
        }))
      },

      initializeDefaultUrls: () => {
        const currentUrls = get().savedUrls
        if (currentUrls.length === 0) {
          set({ savedUrls: DEFAULT_SAVED_URLS })
        }
      },
    }),
    {
      name: "scraping-store",
      // Use onRehydrateStorage to initialize default URLs after rehydration
      onRehydrateStorage: () => (state) => {
        if (state && state.savedUrls.length === 0) {
          state.initializeDefaultUrls()
        }
      },
    },
  ),
)
