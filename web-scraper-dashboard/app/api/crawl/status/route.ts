import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Get session from Django API
    const session = await DjangoApiService.getCrawlSession(jobId)

    // Calculate progress and message based on status
    let progress = session.progress || 0
    let message = "Processing..."

    switch (session.status) {
      case "pending":
        progress = progress || 0
        message = "Preparing to crawl..."
        break
      case "running":
        progress = progress || 50
        message = "Crawling in progress..."
        break
      case "completed":
        progress = 100
        message = "Crawling completed successfully!"
        break
      case "failed":
        progress = 0
        message = "Crawling failed"
        break
    }

    // Get results if completed
    let categoryLinks: string[] = []
    let productData: any[] = []

    if (session.status === "completed") {
      try {
        const links = await DjangoApiService.getCategoryLinks(jobId)
        const products = await DjangoApiService.getProducts(jobId)

        categoryLinks = links.map((link) => link.url)
        productData = products.map((product) => convertToDisplayFormat(product))
      } catch (error) {
        console.error("Error fetching results:", error)
        // Don't fail the whole request if we can't get results
      }
    }

    // Return the current status
    return NextResponse.json({
      id: session.id,
      urls: session.urls,
      status: session.status,
      progress,
      message,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      error: session.error,
      categoryLinks,
      productData,
      elapsedTime: Date.now() - new Date(session.started_at).getTime(),
    })
  } catch (error) {
    console.error("Error in status API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get job status",
      },
      { status: 500 },
    )
  }
}

function convertToDisplayFormat(product: any) {
  return {
    name: product.name,
    price: product.price,
    product_url: product.product_url,
    image_url: product.image_url,
    product_details: {
      "Image URL": product.image_url,
      "Thumbnail Images": product.thumbnail_images || [],
      Title: product.title,
      Rating: product.rating || "0",
      "Customer Reviews": product.customer_reviews || "0",
      "Size Options": product.size_options || [],
      "Product Specification": product.specifications || [],
      "Previous Price": product.previous_price,
      "New Price": product.new_price,
      "Price Range": product.price_range,
      ...product.meta_data,
    },
  }
}
