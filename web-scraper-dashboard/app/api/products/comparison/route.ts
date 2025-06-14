import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId")

    // Get comparison data from Django API
    const comparison = await DjangoApiService.getProductComparison(jobId || undefined)

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error("Error in comparison API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get comparison data",
      },
      { status: 500 },
    )
  }
}
