"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ExternalLink, Download, Star, StarHalf } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { serverConfig } from "@/lib/config"

interface ProductDetail {
  "Image URL": string | null
  "Thumbnail Images": string[]
  Title: string
  Rating: string
  "Customer Reviews": string
  "Size Options": string[]
  "Product Specification": string[]
  "Previous Price": string | null
  "New Price": string | null
  "Price Range": string[] | null
  [key: string]: any
}

interface Product {
  name: string | null
  price: string
  product_url: string
  image_url: string
  product_details: ProductDetail
}

interface WebsiteData {
  url: string
  products: Product[]
}

export function ProductData() {
  const [websiteData, setWebsiteData] = useState<WebsiteData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchProductData = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.DJANGO_API_URL}/products/`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product data")
      }

      setWebsiteData(data.productData || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch product data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProductData()
  }, [])

  // Count total products across all websites
  const totalProducts = websiteData.reduce((total, site) => total + site.products.length, 0)

  // Render star ratings
  const renderRating = (rating: string) => {
    // Handle invalid or empty ratings
    if (!rating || rating === "0" || rating === "N/A" || isNaN(Number.parseFloat(rating))) {
      return (
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground">No ratings yet</span>
        </div>
      )
    }

    const ratingNum = Number.parseFloat(rating)
    // Ensure rating is within a reasonable range (0-5)
    const safeRating = Math.min(Math.max(ratingNum, 0), 5)
    const fullStars = Math.floor(safeRating)
    const hasHalfStar = safeRating % 1 >= 0.5

    return (
      <div className="flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    )
  }

  // Render price information including price range if available
  const renderPriceInfo = (product: Product) => {
    // If there's a price range, show it
    if (product.product_details["Price Range"] && product.product_details["Price Range"].length > 0) {
      const priceRange = product.product_details["Price Range"]
      const minPrice = priceRange.reduce((min, price) => {
        const numPrice = Number.parseFloat(price.replace(/[^0-9.]/g, ""))
        return numPrice < min ? numPrice : min
      }, Number.MAX_VALUE)

      const maxPrice = priceRange.reduce((max, price) => {
        const numPrice = Number.parseFloat(price.replace(/[^0-9.]/g, ""))
        return numPrice > max ? numPrice : max
      }, 0)

      const currencySymbol = priceRange[0].charAt(0)

      return (
        <div className="mt-2 flex items-center gap-2">
          {product.product_details["Previous Price"] && (
            <span className="text-sm line-through text-muted-foreground">
              {product.product_details["Previous Price"]}
            </span>
          )}
          <span className="text-lg font-bold text-red-500">
            {product.product_details["New Price"] || product.price}
          </span>
          {minPrice !== maxPrice && (
            <span className="text-sm text-muted-foreground">
              (Range: {currencySymbol}
              {minPrice.toFixed(2)} - {currencySymbol}
              {maxPrice.toFixed(2)})
            </span>
          )}
        </div>
      )
    }

    // If no price range, show regular price info
    return (
      <div className="mt-2 flex items-center gap-2">
        {product.product_details["Previous Price"] && (
          <span className="text-sm line-through text-muted-foreground">
            {product.product_details["Previous Price"]}
          </span>
        )}
        <span className="text-lg font-bold text-red-500">{product.product_details["New Price"] || product.price}</span>
      </div>
    )
  }

  const downloadData = (format: "json" | "csv" | "excel" | "txt") => {
    if (websiteData.length === 0) {
      toast({
        title: "No data to download",
        description: "There is no product data available to download",
        variant: "destructive",
      })
      return
    }

    let content: string
    let mimeType: string
    let fileExtension: string

    switch (format) {
      case "json":
        content = JSON.stringify(websiteData, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
        break
      case "csv":
        // Create CSV header
        const headers = [
          "Website URL",
          "Product Title",
          "Price",
          "Previous Price",
          "New Price",
          "Rating",
          "Reviews",
          "Product URL",
          "Image URL",
          "Price Range Min",
          "Price Range Max",
          "All Price Options",
        ]

        // Create CSV rows
        const rows = []
        for (const site of websiteData) {
          for (const product of site.products) {
            // Calculate min and max price if price range exists
            const priceRange = product.product_details["Price Range"] || []
            let minPrice = ""
            let maxPrice = ""
            let allPrices = ""

            if (priceRange && priceRange.length > 0) {
              const prices = priceRange.map((p) => Number.parseFloat(p.replace(/[^0-9.]/g, "")))
              minPrice = Math.min(...prices).toFixed(2)
              maxPrice = Math.max(...prices).toFixed(2)
              allPrices = priceRange.join(", ")
            }

            rows.push(
              [
                site.url,
                product.product_details.Title || product.name || "Unknown",
                product.price,
                product.product_details["Previous Price"] || "",
                product.product_details["New Price"] || "",
                product.product_details.Rating || "",
                product.product_details["Customer Reviews"] || "",
                product.product_url,
                product.image_url,
                minPrice,
                maxPrice,
                allPrices,
              ]
                .map((value) => {
                  // Escape values with commas or quotes
                  if (value && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
                    return `"${value.replace(/"/g, '""')}"`
                  }
                  return value
                })
                .join(","),
            )
          }
        }

        content = [headers.join(","), ...rows].join("\n")
        mimeType = "text/csv"
        fileExtension = "csv"
        break
      case "txt":
        const textLines = []
        for (const site of websiteData) {
          textLines.push(`Website: ${site.url}`)
          textLines.push("-------------------")

          for (const product of site.products) {
            textLines.push(`Title: ${product.product_details.Title || product.name || "Unknown Product"}`)
            textLines.push(`Price: ${product.price}`)
            if (product.product_details["Previous Price"]) {
              textLines.push(`Previous Price: ${product.product_details["Previous Price"]}`)
            }
            if (product.product_details["New Price"]) {
              textLines.push(`Sale Price: ${product.product_details["New Price"]}`)
            }
            textLines.push(`Rating: ${product.product_details.Rating || "N/A"}`)
            textLines.push(`Reviews: ${product.product_details["Customer Reviews"] || "0"}`)
            textLines.push(`URL: ${product.product_url}`)
            textLines.push(`Image: ${product.image_url}`)

            // Add price range information
            if (product.product_details["Price Range"] && product.product_details["Price Range"].length > 0) {
              textLines.push(`Price Options: ${product.product_details["Price Range"].join(", ")}`)
            }

            textLines.push("\n-------------------\n")
          }
        }

        content = textLines.join("\n")
        mimeType = "text/plain"
        fileExtension = "txt"
        break
      case "excel":
        // For Excel, we'll create a CSV that Excel can open
        const excelHeaders = [
          "Website URL",
          "Product Title",
          "Price",
          "Previous Price",
          "New Price",
          "Rating",
          "Reviews",
          "Product URL",
          "Image URL",
          "Price Range Min",
          "Price Range Max",
          "All Price Options",
        ]

        const excelRows = []
        for (const site of websiteData) {
          for (const product of site.products) {
            // Calculate min and max price if price range exists
            const priceRange = product.product_details["Price Range"] || []
            let minPrice = ""
            let maxPrice = ""
            let allPrices = ""

            if (priceRange && priceRange.length > 0) {
              const prices = priceRange.map((p) => Number.parseFloat(p.replace(/[^0-9.]/g, "")))
              minPrice = Math.min(...prices).toString()
              maxPrice = Math.max(...prices).toString()
              allPrices = priceRange.join(", ")
            }

            excelRows.push(
              [
                site.url,
                product.product_details.Title || product.name || "Unknown",
                product.price,
                product.product_details["Previous Price"] || "",
                product.product_details["New Price"] || "",
                product.product_details.Rating || "",
                product.product_details["Customer Reviews"] || "",
                product.product_url,
                product.image_url,
                minPrice,
                maxPrice,
                allPrices,
              ]
                .map((value) => {
                  // Escape values with commas or quotes
                  if (value && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
                    return `"${value.replace(/"/g, '""')}"`
                  }
                  return value
                })
                .join(","),
            )
          }
        }

        content = [excelHeaders.join(","), ...excelRows].join("\n")
        mimeType = "application/vnd.ms-excel"
        fileExtension = "csv" // Excel can open CSV files
        break
      default:
        content = JSON.stringify(websiteData, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
    }

    // Create a blob and download it
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `product-data.${fileExtension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: `Downloading product data as ${format.toUpperCase()}`,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Product Data</CardTitle>
          <CardDescription>
            Found {totalProducts} products from {websiteData.length} website{websiteData.length !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchProductData} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : websiteData.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No product data found</p>
        ) : (
          <Tabs defaultValue="grid">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="detailed">Detailed View</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="grid">
              <ScrollArea className="h-[500px]">
                {websiteData.map((site, siteIndex) => (
                  <div key={siteIndex} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {site.url}
                      </a>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {site.products.map((product, productIndex) => (
                        <Card key={productIndex} className="overflow-hidden">
                          <div className="relative">
                            {product.product_details["New Price"] && product.product_details["Previous Price"] && (
                              <Badge className="absolute top-2 right-2 bg-red-500">Sale!</Badge>
                            )}
                            <div className="h-48 overflow-hidden">
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.product_details.Title || "Product image"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                                }}
                              />
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold truncate">
                              {product.product_details.Title || product.name || "Unknown Product"}
                            </h3>
                            <div className="mt-1">
                              {renderRating(product.product_details.Rating || "0")}
                              <span className="text-xs text-muted-foreground">
                                ({product.product_details["Customer Reviews"] || "0"} reviews)
                              </span>
                            </div>
                            {renderPriceInfo(product)}
                            <div className="mt-3">
                              <a
                                href={product.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Product
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="list">
              <ScrollArea className="h-[500px]">
                {websiteData.map((site, siteIndex) => (
                  <div key={siteIndex} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {site.url}
                      </a>
                    </h3>
                    <div className="space-y-4">
                      {site.products.map((product, productIndex) => (
                        <div key={productIndex} className="flex gap-4 p-4 border rounded-md">
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden relative">
                            {product.product_details["New Price"] && product.product_details["Previous Price"] && (
                              <Badge className="absolute top-0 right-0 z-10 bg-red-500 text-xs">Sale!</Badge>
                            )}
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.product_details.Title || "Product image"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=100&width=100"
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">
                              {product.product_details.Title || product.name || "Unknown Product"}
                            </h3>
                            <div className="mt-1">{renderRating(product.product_details.Rating || "0")}</div>
                            {renderPriceInfo(product)}
                            <div className="mt-3">
                              <a
                                href={product.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Product
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="detailed">
              <ScrollArea className="h-[500px]">
                {websiteData.map((site, siteIndex) => (
                  <div key={siteIndex} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {site.url}
                      </a>
                    </h3>
                    <div className="space-y-4">
                      {site.products.map((product, productIndex) => (
                        <Accordion key={productIndex} type="single" collapsible className="border rounded-md">
                          <AccordionItem value={`product-${productIndex}`} className="border-none">
                            <AccordionTrigger className="px-4 py-2 hover:no-underline">
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-12 h-12 flex-shrink-0 overflow-hidden">
                                  <img
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.product_details.Title || "Product image"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg?height=50&width=50"
                                    }}
                                  />
                                </div>
                                <div>
                                  <h3 className="font-semibold">
                                    {product.product_details.Title || product.name || "Unknown Product"}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    {product.product_details["Previous Price"] && (
                                      <span className="text-sm line-through text-muted-foreground">
                                        {product.product_details["Previous Price"]}
                                      </span>
                                    )}
                                    <span className="text-sm font-bold text-red-500">
                                      {product.product_details["New Price"] || product.price}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <img
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.product_details.Title || "Product image"}
                                    className="w-full h-auto object-cover rounded-md"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                                    }}
                                  />
                                  {product.product_details["Thumbnail Images"] &&
                                    product.product_details["Thumbnail Images"].length > 0 && (
                                      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                                        {product.product_details["Thumbnail Images"]
                                          .filter((img) => !img.includes("svg+xml"))
                                          .map((img, i) => (
                                            <img
                                              key={i}
                                              src={img || "/placeholder.svg"}
                                              alt={`Thumbnail ${i + 1}`}
                                              className="w-12 h-12 object-cover rounded-md border"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none"
                                              }}
                                            />
                                          ))}
                                      </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Rating</h4>
                                    <div className="flex items-center">
                                      {renderRating(product.product_details.Rating || "0")}
                                      <span className="ml-2 text-sm">
                                        ({product.product_details["Customer Reviews"] || "0"} reviews)
                                      </span>
                                    </div>
                                  </div>

                                  {product.product_details["Size Options"] &&
                                    product.product_details["Size Options"].length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Available Sizes</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {product.product_details["Size Options"]
                                            .filter((size) => size !== "Choose an option")
                                            .map((size, i) => (
                                              <Badge key={i} variant="outline" className="text-xs">
                                                {size}
                                              </Badge>
                                            ))}
                                        </div>
                                      </div>
                                    )}

                                  {product.product_details["Product Specification"] &&
                                    product.product_details["Product Specification"].length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Specifications</h4>
                                        <ul className="list-disc pl-5 text-sm mt-1">
                                          {product.product_details["Product Specification"].map((spec, i) => (
                                            <li key={i}>{spec}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                  {product.product_details["Price Range"] &&
                                    product.product_details["Price Range"].length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Price Options</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {product.product_details["Price Range"].map((price, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                              {price}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  <div className="pt-2">
                                    <a
                                      href={product.product_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      View Product
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="json">
              <ScrollArea className="h-[500px]">
                <pre className="text-xs p-4 bg-muted rounded-md overflow-x-auto">
                  {JSON.stringify(websiteData, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadData("json")}
          disabled={isLoading || websiteData.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadData("csv")}
          disabled={isLoading || websiteData.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadData("excel")}
          disabled={isLoading || websiteData.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadData("txt")}
          disabled={isLoading || websiteData.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Text
        </Button>
      </CardFooter>
    </Card>
  )
}
