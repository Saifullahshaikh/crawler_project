"use server"

import type { ScrapedData } from "./scrape"

export async function scrapePython(url: string, pythonFile = "scripts/custom_scraper.py"): Promise<ScrapedData> {
  try {
    // Call our API route with the URL and Python file path
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/python-scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, pythonFile }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API responded with status: ${response.status}`)
    }

    const result = await response.json()
    return result as ScrapedData
  } catch (error) {
    console.error("Error calling Python scraper API:", error)
    throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function scrapeUrlsPython(
  urls: string[],
  pythonFile = "scripts/custom_scraper.py",
): Promise<ScrapedData[]> {
  // Filter out empty URLs
  const validUrls = urls.filter((url) => url.trim() !== "")

  if (validUrls.length === 0) {
    throw new Error("No valid URLs provided")
  }

  // Scrape each URL with a slight delay between requests to avoid rate limiting
  const results: ScrapedData[] = []

  for (const url of validUrls) {
    try {
      const result = await scrapePython(url, pythonFile)
      results.push(result)

      // Add a small delay between requests
      if (validUrls.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
      // Add a placeholder for failed URLs
      results.push({
        url,
        title: "Error: Failed to scrape",
        description: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        data: {
          headings: [],
          links: [],
          images: [],
          text: "",
          metaTags: {},
        },
      })
    }
  }

  return results
}
