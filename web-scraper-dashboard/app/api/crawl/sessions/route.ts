import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get("limit")
    const sessions = await DjangoApiService.getLatestCrawlSessions(limit ? Number.parseInt(limit) : 10)

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch sessions",
      },
      { status: 500 },
    )
  }
}
