import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function POST(request: NextRequest) {
  try {
    const { days_old } = await request.json()

    const result = await DjangoApiService.deleteOldCrawlSessions(days_old || 30)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error cleaning up sessions:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to cleanup sessions",
      },
      { status: 500 },
    )
  }
}
