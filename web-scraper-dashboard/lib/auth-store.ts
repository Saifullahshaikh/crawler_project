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
          set({ isAuthenticated: false, user: null })
        }
      },
    }),
    {
      name: "auth-store",
      onRehydrateStorage: () => (state) => {
        // Optionally call checkAuth if needed
        // state?.checkAuth?.()
      },
    }
  )
)
