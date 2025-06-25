"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Hardcoded credentials
const VALID_CREDENTIALS = {
  username: "admin",
  password: "password123",
  email: "admin@webcrawler.com",
}

interface AuthState {
  isAuthenticated: boolean
  user: {
    username: string
    email: string
  } | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (username: string, password: string) => {
        // Check credentials
        if (
          (username === VALID_CREDENTIALS.username || username === VALID_CREDENTIALS.email) &&
          password === VALID_CREDENTIALS.password
        ) {
          set({
            isAuthenticated: true,
            user: {
              username: VALID_CREDENTIALS.username,
              email: VALID_CREDENTIALS.email,
            },
          })
          return true
        }
        return false
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
        })
      },
    }),
    {
      name: "auth-store",
    },
  ),
)
