"use client"

import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Clock, CheckCircle, XCircle, Loader } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDjangoSession } from "@/hooks/use-django-session"
import { useAuthStore } from "@/lib/auth-store"

export function SessionSync() {
  const { user } = useAuthStore()
  const { activeSession, isLoading, error, fetchSessions } = useDjangoSession()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    // Initial fetch
    fetchSessions()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchSessions()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [user, fetchSessions])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "failed":
        return <XCircle className="h-3 w-3 text-red-500" />
      case "running":
        return <Loader className="h-3 w-3 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <Badge variant={error ? "destructive" : "secondary"} className="gap-1">
        {error ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
        {error ? "Offline" : "Synced"}
      </Badge>

      {/* Active Session Info */}
      {activeSession && (
        <Badge variant="default" className="gap-1">
          {getStatusIcon(activeSession.status)}
          {activeSession.status === "running" ? "Crawling" : activeSession.status}
          {activeSession.progress > 0 && ` (${activeSession.progress}%)`}
        </Badge>
      )}

      {/* Refresh Button */}
      {/* This button is removed as per the updates */}

      {/* Session ID (for debugging) */}
      {activeSession && (
        <span className="text-xs text-muted-foreground font-mono">{activeSession.job_id.slice(-8)}</span>
      )}

      {/* User Info */}
      <span className="text-xs text-muted-foreground">User: {user.username}</span>
    </div>
  )
}
