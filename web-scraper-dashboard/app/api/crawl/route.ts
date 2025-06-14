import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "At least one URL is required" }, { status: 400 })
    }

    // Filter out empty URLs
    const validUrls = urls.filter((url: string) => url && typeof url === "string" && url.trim() !== "")

    if (validUrls.length === 0) {
      return NextResponse.json({ error: "No valid URLs provided" }, { status: 400 })
    }

    // Create a crawl session via Django API
    const session = await DjangoApiService.createCrawlSession(validUrls)

    // Start the crawling process by calling Django
    await startDjangoCrawlProcess(session.id, validUrls)

    // Return the session ID
    return NextResponse.json({
      status: "success",
      message: `Crawling started for ${validUrls.length} URL${validUrls.length > 1 ? "s" : ""}`,
      jobId: session.id,
    })
  } catch (error) {
    console.error("Error in crawl API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start crawling process",
      },
      { status: 500 },
    )
  }
}

// Function to trigger Django crawling process
async function startDjangoCrawlProcess(sessionId: string, urls: string[]) {
  try {
    // Call Django API to start the actual crawling
    const response = await fetch(`${process.env.DJANGO_API_URL}/crawl/start/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        urls: urls,
      }),
    })

    if (!response.ok) {
      throw new Error(`Django crawl API responded with status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error starting Django crawl process:", error)
    // Update session status to failed
    await DjangoApiService.updateCrawlSessionStatus(
      sessionId,
      "failed",
      error instanceof Error ? error.message : "Failed to start crawling",
    )
    throw error
  }
}
