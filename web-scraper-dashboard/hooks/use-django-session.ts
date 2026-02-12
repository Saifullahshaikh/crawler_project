"use client"

import { useEffect, useCallback } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useSessionStore } from "@/lib/session-store"

export function useDjangoSession() {
  const { user } = useAuthStore()
  const {
    activeUserSession,
    allUserSessions,
    isLoading,
    error,
    fetchUserSessions,
    createUserSession,
    updateUserSession,
    deleteUserSession,
  } = useSessionStore()

  // Auto-refresh sessions every 5 seconds when user is logged in
  useEffect(() => {
    if (!user?.id) return

    console.log("Setting up session polling for user:", user.id)

    // Initial fetch
    fetchUserSessions(user.id)

    // Set up interval for auto-refresh
    const interval = setInterval(() => {
      console.log("Polling sessions for user:", user.id)
      fetchUserSessions(user.id)
    }, 5000)

    return () => {
      console.log("Cleaning up session polling")
      clearInterval(interval)
    }
  }, [user?.id, fetchUserSessions])

  // Create session wrapper
  const createSession = useCallback(
    async (urls: string[]) => {
      if (!user?.id) {
        console.error("No user ID available for creating session")
        return null
      }
      console.log("Creating session for user:", user.id, "with URLs:", urls)
      return await createUserSession(urls, user.id)
    },
    [user?.id, createUserSession],
  )

  // Update session wrapper
  const updateSession = useCallback(
    async (jobId: string, updates: { status?: string; progress?: number; message?: string; error?: string }) => {
      console.log("Updating session:", jobId, "with updates:", updates)
      return await updateUserSession(jobId, updates)
    },
    [updateUserSession],
  )

  // Delete session wrapper
  const deleteSession = useCallback(
    async (jobId: string) => {
      console.log("Deleting session:", jobId)
      return await deleteUserSession(jobId)
    },
    [deleteUserSession],
  )

  // Manual refresh
  const refreshSessions = useCallback(() => {
    if (user?.id) {
      console.log("Manually refreshing sessions for user:", user.id)
      fetchUserSessions(user.id)
    }
  }, [user?.id, fetchUserSessions])

  return {
    activeSession: activeUserSession,
    allSessions: allUserSessions,
    isLoading,
    error,
    fetchSessions: refreshSessions,
    createSession,
    updateSession,
    deleteSession,
  }
}
