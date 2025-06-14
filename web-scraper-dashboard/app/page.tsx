"use client"

import { useState, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { CrawlerForm } from "@/components/crawler-form"
import { CategoryLinks } from "@/components/category-links"
import { ProductData } from "@/components/product-data"
import { ProductComparison } from "@/components/product-comparison"
import { DatabaseManager } from "@/components/database-manager"

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [completedJobId, setCompletedJobId] = useState<string>("")

  // Function to trigger refresh of category links and product data
  const handleScrapeComplete = useCallback((jobId?: string) => {
    setRefreshTrigger((prev) => prev + 1)
    if (jobId) {
      setCompletedJobId(jobId)
    }
  }, [])

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Crawler Dashboard</h1>
          <p className="text-muted-foreground mt-2">Enter a website URL to crawl for category links and product data</p>
        </div>

        <CrawlerForm onScrapeComplete={handleScrapeComplete} />


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
