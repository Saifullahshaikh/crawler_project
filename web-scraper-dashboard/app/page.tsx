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
import { SessionSync } from "@/components/session-sync"
import { SchedulerManager } from "@/components/SchedulerManager"
import { useAuthStore } from "@/lib/auth-store"
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
  const handleUseSelected = useCallback((selectedUrls: string[]) => {
    setCrawlerUrls(selectedUrls)
  }, [])

  // Handle session restoration
  const handleSessionRestored = useCallback((session: any) => {
    if (session?.urls && Array.isArray(session.urls)) {
      setCrawlerUrls(session.urls)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Crawler Dashboard</h1>
          <p className="text-muted-foreground mt-2">Enter a website URL to crawl for category links and product data</p>
        </div>
        <SessionSync onSessionRestored={handleSessionRestored} />
      </div>

      {/* URL Manager */}
      <UrlManager onUseSelected={handleUseSelected} />

      {/* Crawler Form with controlled URLs */}
      <CrawlerForm urls={crawlerUrls} setUrls={setCrawlerUrls} onScrapeComplete={handleScrapeComplete} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryLinks key={`category-${refreshTrigger}`} />
        <ProductData key={`product-${refreshTrigger}`} />
      </div>

      <ProductComparison refreshTrigger={refreshTrigger} completedJobId={completedJobId} />

      <DatabaseManager />
    </div>
  )
}

export default function HomePage() {
  const { user, logout } = useAuthStore()
  console.log("User from HomePage:", user)
  return (
    <ProtectedRoute>
      <DashboardShell />
      <SchedulerManager userId={user?.id} />
    </ProtectedRoute>
  )
}
