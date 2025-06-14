import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function GET(request: NextRequest) {
  try {
    // Get the latest category links from Django API
    const categoryLinks = await DjangoApiService.getLatestCategoryLinks()

    return NextResponse.json({
      categoryLinks: categoryLinks.map((link) => link.url),
    })
  } catch (error) {
    console.error("Error in categories API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get category links",
      },
      { status: 500 },
    )
  }
}
