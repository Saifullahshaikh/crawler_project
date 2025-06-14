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

interface ScrapingState {
  currentData: ScrapedDataItem[]
  history: HistoryItem[]
  savedData: SavedDataItem[]
  addScrapedData: (data: ScrapedDataItem[]) => void
  saveData: () => void
  removeFromHistory: (id: string) => void
  removeSavedData: (id: string) => void
}

export const useScrapingStore = create<ScrapingState>()(
  persist(
    (set) => ({
      currentData: [],
      history: [],
      savedData: [],

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
    }),
    {
      name: "scraping-store",
    },
  ),
)
