import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get("format") as "json" | "csv" | "excel"
    const crawlSessionId = request.nextUrl.searchParams.get("crawl_session_id")

    if (!format || !["json", "csv", "excel"].includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 })
    }

    const blob = await DjangoApiService.exportData(format, crawlSessionId || undefined)

    const contentType =
      format === "json"
        ? "application/json"
        : format === "csv"
          ? "text/csv"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="crawl-data.${format}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to export data",
      },
      { status: 500 },
    )
  }
}
