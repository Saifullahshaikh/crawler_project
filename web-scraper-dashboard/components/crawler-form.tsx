"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, PlusCircle, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface CrawlStatus {
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  message?: string
  error?: string
}

export function CrawlerForm({ onScrapeComplete }: { onScrapeComplete: (jobId?: string) => void }) {
  const [urls, setUrls] = useState<string[]>([
    "https://www.nyjacket.com/",
    "https://www.californiajacket.com/",
    "https://wonderjackets.com/",
    "https://www.danezon.com/",
    "https://www.jacketsjunction.com/",
    "https://www.primejackets.com/",
    "https://www.jackfitleathers.com/",
    "http://newamericanjackets.com/",
    "https://www.usajacket.com/",
    "https://www.usaleatherfactory.com/",
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<CrawlStatus | null>(null)
  const { toast } = useToast()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [])

  const addUrlField = () => {
    setUrls([...urls, ""])
  }

  const removeUrlField = (index: number) => {
    const newUrls = [...urls]
    newUrls.splice(index, 1)
    // Ensure at least one URL field remains
    setUrls(newUrls.length ? newUrls : [""])
  }

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty URLs
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
      const response = await fetch("http://167.172.143.147:8000/api/crawl/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: validUrls }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start crawling")
      }

      setJobId(data.jobId)
      setStatus({ status: "running", progress: 0, message: "Crawling started..." })

      toast({
        title: "Crawling started",
        description: `Started crawling ${validUrls.length} URL${validUrls.length > 1 ? "s" : ""}`,
      })

      // Start polling for status
      pollJobStatus(data.jobId)
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
      const response = await fetch(`http://167.172.143.147:8000/api/crawl/status?jobId=${jobId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get job status")
      }

      // Update status
      setStatus({
        status: data.status,
        progress: data.progress,
        message: data.message || getStatusMessage(data.status, data.progress),
        error: data.error,
      })

      if (data.status === "completed") {
        setIsLoading(false)
        toast({
          title: "Crawling completed",
          description: `Found ${data.categoryLinks?.length || 0} category links and ${data.productData?.length || 0} products`,
        })

        // Trigger the callback with the completed job ID
        onScrapeComplete(jobId)
      } else if (data.status === "failed") {
        setIsLoading(false)
        toast({
          title: "Crawling failed",
          description: data.error || "Failed to crawl website",
          variant: "destructive",
        })
      } else {
        // Still running, poll again after a delay
        pollingRef.current = setTimeout(() => pollJobStatus(jobId), 2000)
      }
    } catch (error) {
      setStatus({
        status: "failed",
        progress: 0,
        error: error instanceof Error ? error.message : "Failed to get job status",
      })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get job status",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const getStatusMessage = (status: string, progress: number): string => {
    switch (status) {
      case "pending":
        return "Preparing to crawl..."
      case "running":
        if (progress < 25) return "Connecting to website..."
        if (progress < 50) return "Extracting category links..."
        if (progress < 75) return "Processing product data..."
        return "Finalizing results..."
      case "completed":
        return "Crawling completed successfully!"
      case "failed":
        return "Crawling failed. Please try again."
      default:
        return "Processing..."
    }
  }

  const renderStatusIcon = () => {
    if (!status) return null

    switch (status.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "running":
      case "pending":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website Crawler</CardTitle>
        <CardDescription>Enter one or more website URLs to crawl for category links and product data</CardDescription>
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
                  disabled={isLoading}
                  className="flex-1"
                />
                {urls.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeUrlField(index)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={addUrlField} disabled={isLoading} className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add URL
            </Button>

            <Button type="submit" disabled={isLoading} className="ml-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Crawling...
                </>
              ) : (
                `Start Crawling (${urls.filter((u) => u.trim() !== "").length} URL${
                  urls.filter((u) => u.trim() !== "").length !== 1 ? "s" : ""
                })`
              )}
            </Button>
          </div>

          {status && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderStatusIcon()}
                  <span className="text-sm font-medium">
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </span>
                  {jobId && <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{jobId}</span>}
                </div>
                <span className="text-sm text-muted-foreground">{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="h-2" />
              <p className="text-sm text-muted-foreground">{status.message || "Processing..."}</p>
              {status.error && <p className="text-sm text-red-500">{status.error}</p>}
            </div>
          )}

          {jobId && !isLoading && status?.status === "completed" && (
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onScrapeComplete(jobId)}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh Data
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
