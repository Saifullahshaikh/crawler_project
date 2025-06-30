"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { djangoApiService, type UserSession, type CrawlSession } from "./django-api-service"

interface SessionState {
  // User Sessions
  activeUserSession: UserSession | null
  allUserSessions: UserSession[]

  // Crawl Sessions
  activeCrawlSession: CrawlSession | null
  allCrawlSessions: CrawlSession[]

  // Loading states
  isLoading: boolean
  error: string | null

  // Actions
  setActiveUserSession: (session: UserSession | null) => void
  setAllUserSessions: (sessions: UserSession[]) => void
  setActiveCrawlSession: (session: CrawlSession | null) => void
  setAllCrawlSessions: (sessions: CrawlSession[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Session management
  createUserSession: (urls: string[], userId: string) => Promise<UserSession | null>
  updateUserSession: (jobId: string, updates: any) => Promise<UserSession | null>
  deleteUserSession: (jobId: string) => Promise<boolean>

  // Crawl session management
  createCrawlSession: (urls: string[], userId: string) => Promise<CrawlSession | null>
  updateCrawlSession: (sessionId: string, updates: any) => Promise<CrawlSession | null>
  deleteCrawlSession: (sessionId: string) => Promise<boolean>

  // Fetch methods
  fetchUserSessions: (userId: string) => Promise<void>
  fetchCrawlSessions: (userId: string) => Promise<void>

  // Session restoration
  restoreSessionsFromStorage: () => void
  clearAllSessions: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeUserSession: null,
      allUserSessions: [],
      activeCrawlSession: null,
      allCrawlSessions: [],
      isLoading: false,
      error: null,

      // Basic setters
      setActiveUserSession: (session) => {
        console.log("Setting active user session:", session)
        set({ activeUserSession: session })
      },
      setAllUserSessions: (sessions) => {
        console.log("Setting all user sessions:", sessions.length, "sessions")
        set({ allUserSessions: sessions })
      },
      setActiveCrawlSession: (session) => {
        console.log("Setting active crawl session:", session)
        set({ activeCrawlSession: session })
      },
      setAllCrawlSessions: (sessions) => {
        console.log("Setting all crawl sessions:", sessions.length, "sessions")
        set({ allCrawlSessions: sessions })
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => {
        console.log("Setting error:", error)
        set({ error })
      },

      // User session management
      createUserSession: async (urls: string[], userId: string) => {
        console.log("Creating user session for user:", userId, "with URLs:", urls)
        set({ isLoading: true, error: null })
        try {
          const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          console.log("Generated job ID:", jobId)

          const session = await djangoApiService.createUserSession({
            job_id: jobId,
            user_id: userId,
            urls,
          })

          console.log("Created session:", session)
          set({ activeUserSession: session })
          get().fetchUserSessions(userId) // Refresh all sessions
          return session
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to create session"
          console.error("Failed to create user session:", errorMessage)
          set({ error: errorMessage })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      updateUserSession: async (jobId: string, updates: any) => {
        console.log("Updating user session:", jobId, "with updates:", updates)
        try {
          const session = await djangoApiService.updateUserSession(jobId, updates)
          console.log("Updated session:", session)
          set({ activeUserSession: session })

          // Update in all sessions list
          const { allUserSessions } = get()
          const updatedSessions = allUserSessions.map((s) => (s.job_id === jobId ? session : s))
          set({ allUserSessions: updatedSessions })

          return session
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to update session"
          console.error("Failed to update user session:", errorMessage)
          set({ error: errorMessage })
          return null
        }
      },

      deleteUserSession: async (jobId: string) => {
        console.log("Deleting user session:", jobId)
        try {
          const result = await djangoApiService.deleteUserSession(jobId)
          if (result.success) {
            const { activeUserSession, allUserSessions } = get()

            // Clear active session if it's the one being deleted
            if (activeUserSession?.job_id === jobId) {
              set({ activeUserSession: null })
            }

            // Remove from all sessions
            const filteredSessions = allUserSessions.filter((s) => s.job_id !== jobId)
            set({ allUserSessions: filteredSessions })
          }
          return result.success
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to delete session"
          console.error("Failed to delete user session:", errorMessage)
          set({ error: errorMessage })
          return false
        }
      },

      // Crawl session management
      createCrawlSession: async (urls: string[], userId: string) => {
        console.log("Creating crawl session for user:", userId, "with URLs:", urls)
        set({ isLoading: true, error: null })
        try {
          const session = await djangoApiService.createCrawlSession(urls, userId)
          console.log("Created crawl session:", session)
          set({ activeCrawlSession: session })
          get().fetchCrawlSessions(userId) // Refresh all sessions
          return session
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to create crawl session"
          console.error("Failed to create crawl session:", errorMessage)
          set({ error: errorMessage })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      updateCrawlSession: async (sessionId: string, updates: any) => {
        console.log("Updating crawl session:", sessionId, "with updates:", updates)
        try {
          const session = await djangoApiService.updateCrawlSessionStatus(sessionId, updates.status, updates.error)
          console.log("Updated crawl session:", session)
          set({ activeCrawlSession: session })

          // Update in all sessions list
          const { allCrawlSessions } = get()
          const updatedSessions = allCrawlSessions.map((s) => (s.id === sessionId ? session : s))
          set({ allCrawlSessions: updatedSessions })

          return session
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to update crawl session"
          console.error("Failed to update crawl session:", errorMessage)
          set({ error: errorMessage })
          return null
        }
      },

      deleteCrawlSession: async (sessionId: string) => {
        console.log("Deleting crawl session:", sessionId)
        try {
          const result = await djangoApiService.deleteCrawlSession(sessionId)
          if (result.success) {
            const { activeCrawlSession, allCrawlSessions } = get()

            // Clear active session if it's the one being deleted
            if (activeCrawlSession?.id === sessionId) {
              set({ activeCrawlSession: null })
            }

            // Remove from all sessions
            const filteredSessions = allCrawlSessions.filter((s) => s.id !== sessionId)
            set({ allCrawlSessions: filteredSessions })
          }
          return result.success
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to delete crawl session"
          console.error("Failed to delete crawl session:", errorMessage)
          set({ error: errorMessage })
          return false
        }
      },

      // Fetch methods
      fetchUserSessions: async (userId: string) => {
        console.log("Fetching user sessions for user:", userId)
        set({ isLoading: true, error: null })
        try {
          const response = await djangoApiService.getUserSessions(userId)
          console.log("Fetched user sessions:", response)
          set({
            activeUserSession: response.active_session,
            allUserSessions: response.all_sessions,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch user sessions"
          console.error("Failed to fetch user sessions:", errorMessage)
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchCrawlSessions: async (userId: string) => {
        console.log("Fetching crawl sessions for user:", userId)
        set({ isLoading: true, error: null })
        try {
          const sessions = await djangoApiService.getLatestCrawlSessions(userId)
          console.log("Fetched crawl sessions:", sessions)
          set({ allCrawlSessions: sessions })

          // Set active crawl session if there's a running one
          const runningSession = sessions.find((s) => s.status === "running")
          if (runningSession) {
            set({ activeCrawlSession: runningSession })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch crawl sessions"
          console.error("Failed to fetch crawl sessions:", errorMessage)
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      // Session restoration
      restoreSessionsFromStorage: () => {
        // This will be called when the store is rehydrated
        const { activeUserSession, activeCrawlSession } = get()

        console.log("Restoring sessions from storage")
        console.log("Active user session:", activeUserSession)
        console.log("Active crawl session:", activeCrawlSession)

        // Check if we have active sessions and they're still valid
        if (activeUserSession && activeUserSession.status === "running") {
          // Session is still active, keep it
          console.log("Restored active user session:", activeUserSession.job_id)
        }

        if (activeCrawlSession && activeCrawlSession.status === "running") {
          // Crawl session is still active, keep it
          console.log("Restored active crawl session:", activeCrawlSession.id)
        }
      },

      clearAllSessions: () => {
        console.log("Clearing all sessions")
        set({
          activeUserSession: null,
          allUserSessions: [],
          activeCrawlSession: null,
          allCrawlSessions: [],
          error: null,
        })
      },
    }),
    {
      name: "session-store",
      // Only persist the sessions, not loading states
      partialize: (state) => ({
        activeUserSession: state.activeUserSession,
        allUserSessions: state.allUserSessions,
        activeCrawlSession: state.activeCrawlSession,
        allCrawlSessions: state.allCrawlSessions,
      }),
    },
  ),
)
