"use server"

import * as cheerio from "cheerio"

export type ScrapedData = {
  url: string
  title: string
  description: string
  timestamp: string
  data: {
    headings: string[]
    links: string[]
    images: string[]
    text: string
    metaTags: Record<string, string>
  }
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  try {
    // Validate URL
    const validatedUrl = validateUrl(url)

    // Fetch the HTML content
    const response = await fetch(validatedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()

    // Parse the HTML using cheerio
    const $ = cheerio.load(html)

    // Extract data
    const title = $("title").text().trim() || "No title found"

    // Extract meta description
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "No description found"

    // Extract headings
    const headings: string[] = []
    $("h1, h2, h3").each((_, element) => {
      const headingText = $(element).text().trim()
      if (headingText) headings.push(headingText)
    })

    // Extract links
    const links: string[] = []
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href")
      if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        try {
          // Convert relative URLs to absolute
          const absoluteUrl = new URL(href, validatedUrl).toString()
          links.push(absoluteUrl)
        } catch (e) {
          // Skip invalid URLs
        }
      }
    })

    // Extract images
    const images: string[] = []
    $("img[src]").each((_, element) => {
      const src = $(element).attr("src")
      if (src) {
        try {
          // Convert relative URLs to absolute
          const absoluteSrc = new URL(src, validatedUrl).toString()
          images.push(absoluteSrc)
        } catch (e) {
          // Skip invalid URLs
        }
      }
    })

    // Extract main text content
    const text = $("body").text().replace(/\s+/g, " ").trim()

    // Extract meta tags
    const metaTags: Record<string, string> = {}
    $("meta").each((_, element) => {
      const name = $(element).attr("name") || $(element).attr("property")
      const content = $(element).attr("content")
      if (name && content) {
        metaTags[name] = content
      }
    })

    return {
      url: validatedUrl,
      title,
      description,
      timestamp: new Date().toISOString(),
      data: {
        headings: headings.slice(0, 20), // Limit to 20 headings
        links: [...new Set(links)].slice(0, 50), // Remove duplicates and limit to 50 links
        images: [...new Set(images)].slice(0, 20), // Remove duplicates and limit to 20 images
        text: text.slice(0, 1000), // Limit text to 1000 characters
        metaTags,
      },
    }
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function validateUrl(url: string): string {
  // Add http:// if no protocol is specified
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url
  }

  try {
    new URL(url)
    return url
  } catch (e) {
    throw new Error(`Invalid URL: ${url}`)
  }
}

export async function scrapeUrls(urls: string[]): Promise<ScrapedData[]> {
  // Filter out empty URLs
  const validUrls = urls.filter((url) => url.trim() !== "")

  if (validUrls.length === 0) {
    throw new Error("No valid URLs provided")
  }

  // Scrape each URL with a slight delay between requests to avoid rate limiting
  const results: ScrapedData[] = []

  for (const url of validUrls) {
    try {
      const result = await scrapeUrl(url)
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
