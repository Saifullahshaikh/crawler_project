"use client"

import { useState } from "react"
import { UrlManager } from "./url-manager"
import { CrawlerForm } from "./crawler-form"

interface CrawlerWithUrlManagerProps {
  onScrapeComplete: (jobId?: string) => void
}

export function CrawlerWithUrlManager({ onScrapeComplete }: CrawlerWithUrlManagerProps) {
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
    <div className="space-y-6">
      <UrlManager onUrlSelect={handleUrlSelect} onMultipleUrlSelect={handleMultipleUrlSelect} />
      <CrawlerForm urls={crawlerUrls} setUrls={setCrawlerUrls} onScrapeComplete={onScrapeComplete} />
    </div>
  )
}
