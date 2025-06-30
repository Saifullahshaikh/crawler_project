"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { LoginForm } from "./login-form"
import { Loader2 } from "lucide-react"
import { djangoApiService } from "@/lib/django-api-service"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, setLoading, checkAuth } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true)
      try {
        // Check if we have a valid session with Django
        const response = await djangoApiService.healthCheck()
        console.log("Django API health check:", response)

        // Check authentication status
        await checkAuth()
      } catch (error) {
        console.error("Session check failed:", error)
        // If Django API is down but we have demo user, keep them authenticated
        if (user?.id === "2") {
          console.log("Django API down, but demo user authenticated")
        }
      } finally {
        setLoading(false)
        setIsInitializing(false)
      }
    }

    checkSession()
  }, [setLoading, checkAuth, user])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return <>{children}</>
}
