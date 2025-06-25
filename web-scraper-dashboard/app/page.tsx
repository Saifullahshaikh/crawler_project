"use client"

import { useState, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { CrawlerForm } from "@/components/crawler-form"
import { CategoryLinks } from "@/components/category-links"
import { ProductData } from "@/components/product-data"
import { ProductComparison } from "@/components/product-comparison"
import { DatabaseManager } from "@/components/database-manager"
import { UrlManager } from "@/components/url-manager"
import { ProtectedRoute } from "@/components/protected-route"

function DashboardContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [completedJobId, setCompletedJobId] = useState<string>("")

  // State for crawler URLs
  const [crawlerUrls, setCrawlerUrls] = useState<string[]>([
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

  // Function to trigger refresh of category links and product data
  const handleScrapeComplete = useCallback((jobId?: string) => {
    setRefreshTrigger((prev) => prev + 1)
    if (jobId) {
      setCompletedJobId(jobId)
    }
  }, [])

  // Handle URL selection from URL Manager
  const handleUrlSelect = (url: string) => {
    // Add single URL to the first empty field or add new field
    const emptyIndex = crawlerUrls.findIndex((u) => u.trim() === "")
    if (emptyIndex !== -1) {
      const newUrls = [...crawlerUrls]
      newUrls[emptyIndex] = url
      setCrawlerUrls(newUrls)
    } else {
      setCrawlerUrls([...crawlerUrls, url])
    }
  }

  const handleMultipleUrlSelect = (urls: string[]) => {
    // Replace all URLs with selected ones
    setCrawlerUrls(urls)
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Crawler Dashboard</h1>
          <p className="text-muted-foreground mt-2">Enter a website URL to crawl for category links and product data</p>
        </div>

        {/* URL Manager */}
        <UrlManager onUrlSelect={handleUrlSelect} onMultipleUrlSelect={handleMultipleUrlSelect} />

        {/* Crawler Form with controlled URLs */}
        <CrawlerForm urls={crawlerUrls} setUrls={setCrawlerUrls} onScrapeComplete={handleScrapeComplete} />
        <ProductComparison refreshTrigger={refreshTrigger} completedJobId={completedJobId} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryLinks key={`category-${refreshTrigger}`} />
          <ProductData key={`product-${refreshTrigger}`} />
        </div>


        {/* <DatabaseManager /> */}
      </div>
    </DashboardShell>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
