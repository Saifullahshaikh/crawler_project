import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DjangoApiService } from "@/lib/django-api-service"

export async function GET(request: NextRequest) {
  try {
    // Get the latest products from Django API
    const products = await DjangoApiService.getLatestProducts()

    // Group products by website URL
    const productsByWebsite = new Map<string, any[]>()

    for (const product of products) {
      const websiteUrl = product.website_url
      if (!productsByWebsite.has(websiteUrl)) {
        productsByWebsite.set(websiteUrl, [])
      }

      productsByWebsite.get(websiteUrl)!.push({
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
      })
    }

    // Convert to the expected format
    const productData = Array.from(productsByWebsite.entries()).map(([url, products]) => ({
      url,
      products,
    }))

    return NextResponse.json({ productData })
  } catch (error) {
    console.error("Error in products API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get product data",
      },
      { status: 500 },
    )
  }
}
