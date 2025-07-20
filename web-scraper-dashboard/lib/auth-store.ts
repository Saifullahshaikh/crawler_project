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
        try {
          const res = await djangoApiService.getSessionStatus()

          if (res?.authenticated && res.user) {
            set({ isAuthenticated: true, user: res.user })
          } else {
            set({ isAuthenticated: false, user: null })
          }
        } catch (error) {
          console.error("checkAuth error:", error)

          const currentUser = get().user
          if (currentUser?.id === "2") {
            console.log("Preserving demo user session despite error.")
            return
          }

          set({ isAuthenticated: false, user: null })
        }
      },
    }),
    {
      name: "auth-store",
      // ✅ Optional: Remove auto checkAuth on rehydrate if unnecessary
      onRehydrateStorage: () => (state) => {
        // Optionally skip this if you want full control from ProtectedRoute
        // state?.checkAuth?.()
      },
    }
  )
)
