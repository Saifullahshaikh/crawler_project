import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await DjangoApiService.deleteCrawlSession(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete session",
      },
      { status: 500 },
    )
  }
}
