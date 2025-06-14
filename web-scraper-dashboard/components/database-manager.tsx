"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Database, Trash2, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CrawlSession {
  id: string
  urls: string[]
  status: string
  started_at: string
  completed_at?: string
  error?: string
}

export function DatabaseManager() {
  const [sessions, setSessions] = useState<CrawlSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/crawl/sessions")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sessions")
      }

      setSessions(data.sessions || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch sessions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/crawl/sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete session")
      }

      setSessions(sessions.filter((s) => s.id !== sessionId))
      toast({
        title: "Session deleted",
        description: "Crawl session and all associated data have been deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      })
    }
  }

  const exportData = async (format: "json" | "csv") => {
    try {
      const response = await fetch(`/api/export?format=${format}`)

      if (!response.ok) {
        throw new Error("Failed to export data")
      }

      const blob = await response.blob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `crawl-data.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export started",
        description: `Downloading all data as ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const cleanupOldSessions = async () => {
    try {
      const response = await fetch("/api/crawl/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days_old: 30 }),
      })

      if (!response.ok) {
        throw new Error("Failed to cleanup old sessions")
      }

      const data = await response.json()

      toast({
        title: "Cleanup completed",
        description: `Deleted ${data.deleted_count} old crawl sessions`,
      })

      // Refresh the sessions list
      fetchSessions()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup old sessions",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>Manage crawl sessions and database records via Django API</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData("json")} className="gap-1">
            <Download className="h-3 w-3" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData("csv")} className="gap-1">
            <Download className="h-3 w-3" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={cleanupOldSessions} className="gap-1">
            <Trash2 className="h-3 w-3" />
            Cleanup Old
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSessions} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No crawl sessions found</p>
            <Button onClick={fetchSessions} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          session.status === "completed"
                            ? "default"
                            : session.status === "failed"
                              ? "destructive"
                              : session.status === "running"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {session.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(session.started_at).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Session ID:</strong> {session.id}
                    </p>
                    <p>
                      <strong>URLs:</strong> {session.urls.join(", ")}
                    </p>
                    {session.completed_at && (
                      <p>
                        <strong>Completed:</strong> {new Date(session.completed_at).toLocaleString()}
                      </p>
                    )}
                    {session.error && (
                      <p className="text-red-500">
                        <strong>Error:</strong> {session.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
