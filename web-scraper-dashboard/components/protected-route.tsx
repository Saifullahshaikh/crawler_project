"use client"

import type React from "react"

import { useAuthStore } from "@/lib/auth-store"
import { LoginForm } from "./login-form"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return <>{children}</>
}
