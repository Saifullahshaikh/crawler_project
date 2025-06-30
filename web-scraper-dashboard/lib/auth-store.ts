"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { djangoApiService } from "./django-api-service"

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
}

// Hardcoded credentials for demo
const DEMO_CREDENTIALS = {
  username: "admin",
  email: "admin@webcrawler.com",
  password: "password123",
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      login: async (username: string, password: string) => {
        set({ isLoading: true })

        try {
          // First try demo credentials
          if (
            (username === DEMO_CREDENTIALS.username || username === DEMO_CREDENTIALS.email) &&
            password === DEMO_CREDENTIALS.password
          ) {
            const demoUser: User = {
              id: "2",
              username: DEMO_CREDENTIALS.username,
              email: DEMO_CREDENTIALS.email,
            }

            set({
              user: demoUser,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          }

          // Try Django API authentication
          const response = await djangoApiService.login(username, password)

          if (response.success && response.user) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          }

          set({ isLoading: false })
          return false
        } catch (error) {
          console.error("Login error:", error)
          set({ isLoading: false })
          return false
        }
      },

      logout: async () => {
        set({ isLoading: true })

        try {
          // Try to logout from Django API
          await djangoApiService.logout()
        } catch (error) {
          console.error("Logout error:", error)
        }

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      checkAuth: async () => {
        const { user } = get()
        if (!user) {
          set({ isAuthenticated: false })
          return
        }

        try {
          // Check with Django API if session is still valid
          const response = await djangoApiService.getSessionStatus()
          if (response.authenticated && response.user) {
            set({
              user: response.user,
              isAuthenticated: true,
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
            })
          }
        } catch (error) {
          console.error("Auth check error:", error)
          // Keep demo user authenticated even if Django API is down
          if (user.id === "2") {
            set({ isAuthenticated: true })
          } else {
            set({
              user: null,
              isAuthenticated: false,
            })
          }
        }
      },
    }),
    {
      name: "auth-store",
      onRehydrationComplete: (state) => {
        state.checkAuth()
      },
    },
  ),
)
