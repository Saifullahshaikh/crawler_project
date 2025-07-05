"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import {
  Loader2, PlusCircle, Trash2, RefreshCw, CheckCircle, AlertCircle, Bookmark,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { useScrapingStore } from "@/lib/store"
import djangoApiService from "@/lib/django-api-service"

import { useUIStore } from "@/lib/ui-store"


interface CrawlStatus {
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  message?: string
  error?: string
}

interface CrawlerFormProps {
  onScrapeComplete: (jobId?: string) => void
  userId: string
  urls?: string[]
  setUrls?: (urls: string[]) => void
}

export function CrawlerForm({ onScrapeComplete, userId, urls: externalUrls, setUrls: setExternalUrls }: CrawlerFormProps) {
  const [internalUrls, setInternalUrls] = useState<string[]>([""
  ])

  const urls = externalUrls || internalUrls
  const setUrls = setExternalUrls || setInternalUrls

  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<CrawlStatus | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { addSavedUrl } = useScrapingStore()

  const { showManualButton } = useUIStore()

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [])

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { active_session } = await djangoApiService.getUserSessions(userId)

        if (active_session && ["pending", "running"].includes(active_session.status)) {
          setJobId(active_session.job_id)
          setUrls(active_session.urls)
          setStatus({
            status: active_session.status,
            progress: active_session.progress,
            message: active_session.message || getStatusMessage(active_session.status, active_session.progress),
            error: active_session.error || "",
          })
          setIsLoading(true)
          pollJobStatus(active_session.job_id)

          toast({
            title: "Session Restored",
            description: `Resumed crawling for ${active_session.urls.length} URL(s)`,
          })
        }
      } catch (err) {
        console.error("Failed to restore session:", err)
      } finally {
        setIsCheckingSession(false)
      }
    }

    restoreSession()
  }, [userId])

  const addUrlField = () => setUrls([...urls, ""])

  const removeUrlField = (index: number) => {
    const newUrls = [...urls]
    newUrls.splice(index, 1)
    setUrls(newUrls.length ? newUrls : [""])
  }

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleSaveUrl = (url: string) => {
    if (!url.trim()) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL", variant: "destructive" })
      return
    }

    try {
      new URL(url)
      addSavedUrl(url.trim())
      toast({ title: "URL Saved", description: "URL has been added to your saved list" })
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid URL format", variant: "destructive" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validUrls = urls.filter((url) => url.trim() !== "")
    if (validUrls.length === 0) {
      toast({
        title: "URL is required",
        description: "Please enter at least one website URL to crawl",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setStatus({ status: "pending", progress: 0, message: "Starting crawl process..." })

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/crawl/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validUrls }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to start crawling")

      const jobId = data.jobId
      setJobId(jobId)
      setStatus({ status: "running", progress: 0, message: "Crawling started..." })

      await djangoApiService.createUserSession({
        job_id: jobId,
        user_id: userId,
        urls: validUrls,
        status: "running",
      })

      toast({
        title: "Crawling started",
        description: `Started crawling ${validUrls.length} URL${validUrls.length > 1 ? "s" : ""}`,
      })

      pollJobStatus(jobId)
    } catch (error) {
      setStatus({
        status: "failed",
        progress: 0,
        error: error instanceof Error ? error.message : "Failed to start crawling",
      })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start crawling",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/crawl/status?jobId=${jobId}`)
    console.log(response)
    const data = await response.json()

    console.log("Polling job status:", data)

    if (!response.ok) {
      throw new Error(data.error || "Failed to get job status")
    }

    const crawlStatus: CrawlStatus = {
      status: data.status,
      progress: data.progress,
      message: data.message || getStatusMessage(data.status, data.progress),
      error: data.error,
    }

    // Update UI state
    setStatus(crawlStatus)

    // --- ✅ Handle Completion ---
    if (data.status === "completed") {
      await djangoApiService.updateUserSession(jobId, {
        status: "completed",
        progress: 100,
        message: "Crawling completed successfully",
      })

      setIsLoading(false)

      toast({
        title: "Crawling completed",
        description: `Found ${data.categoryLinks?.length || 0} category links and ${data.productData?.length || 0} products`,
      })

      onScrapeComplete?.(jobId)
      console.log("Crawling failed:", data.status)
    // --- ✅ Handle Failure ---
    } else if (data.status === "failed") {
      await djangoApiService.updateUserSession(jobId, {
      status: "failed",
      progress: data.progress || 0,
      error: data.error || "Unknown error",
      })
    } else {
      pollingRef.current = setTimeout(() => pollJobStatus(jobId), 2000)
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch job status"

    setStatus({
      status: "failed",
      progress: 0,
      error: message,
    })

    await djangoApiService.updateUserSession(jobId, {
      status: "failed",
      progress: 0,
      error: message,
    })

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    })

    setIsLoading(false)
  }
}


  const getStatusMessage = (status: string, progress: number): string => {
    switch (status) {
      case "pending": return "Preparing to crawl..."
      case "running":
        if (progress < 25) return "Connecting to website..."
        if (progress < 50) return "Extracting category links..."
        if (progress < 75) return "Processing product data..."
        return "Finalizing results..."
      case "completed": return "Crawling completed successfully!"
      case "failed": return "Crawling failed. Please try again."
      default: return "Processing..."
    }
  }

  const renderStatusIcon = () => {
    if (!status) return null
    switch (status.status) {
      case "completed": return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed": return <AlertCircle className="h-5 w-5 text-red-500" />
      case "running":
      case "pending": return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default: return null
    }
  }

  // ✅ Show full-screen loader while checking session
  if (isCheckingSession) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          <p className="text-sm text-muted-foreground">Checking for active session...</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website Crawler</CardTitle>
        <CardDescription>Crawling Status and Progress</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  disabled={true}
                  className="flex-1"
                />
                {url.trim() && (
                  <Button type="button" variant="outline" size="icon" onClick={() => handleSaveUrl(url)} disabled={isLoading}>
                    <Bookmark className="h-4 w-4" />
                  </Button>
                )}
                {urls.length > 1 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeUrlField(index)} disabled={isLoading}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
           {isLoading ? (
          <div className="flex flex-col sm:flex-row gap-2">
            {/* <Button type="button" variant="outline" onClick={addUrlField} disabled={isLoading} className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add URL
            </Button> */}
            {showManualButton && (
            <Button type="submit" disabled={isLoading} className="ml-auto">
             
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Crawling...
                </>
            </Button>
            )}
          </div>
          ): (
                ``
              )}
          {status && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderStatusIcon()}
                  <span className="text-sm font-medium">{status.status.charAt(0).toUpperCase() + status.status.slice(1)}</span>
                  {jobId && <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{jobId}</span>}
                </div>
                <span className="text-sm text-muted-foreground">{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="h-2" />
              <p className="text-sm text-muted-foreground">{status.message || "Processing..."}</p>
              {status.error && <p className="text-sm text-red-500">{status.error}</p>}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
