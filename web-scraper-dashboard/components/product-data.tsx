"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ExternalLink, Download, Star, StarHalf } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface ProductDetail {
  "Image URL": string | null
  "Thumbnail Images": string[]
  Title: string
  Rating: string
  "Customer Reviews": string
  "Size Options": string[]
  "Product Specification": string[] | null
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
  details: ProductDetail
}

interface WebsiteData {
  url: string
  products: Product[]
}

export function ProductData() {
  const [websiteData, setWebsiteData] = useState<WebsiteData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name-asc")
  const [filterRating, setFilterRating] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const { toast } = useToast()

  const fetchProductData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/products/`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product data")
      }

      const transformedData: WebsiteData[] = [
        {
          url: data.productData[0]?.category_url || "https://www.nyjacket.com/shop",
          products: data.productData.map((item: any) => ({
            name: item.name,
            price: item.price,
            product_url: item.product_url,
            image_url: item.image_url,
            details: item.details,
          })),
        },
      ]

      setWebsiteData(transformedData)
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

  // Filter, search, and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let products = websiteData.flatMap(site => site.products)

    // Search across all parameters
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      products = products.filter(product => {
        // Check top-level product fields
        const topLevelMatches = [
          product.name,
          product.price,
          product.product_url,
          product.image_url
        ].some(field => field?.toLowerCase().includes(lowerSearchTerm))

        // Check product details
        const detailMatches = Object.values(product.details).some(value => {
          if (Array.isArray(value)) {
            return value.some(item => item?.toLowerCase().includes(lowerSearchTerm))
          }
          return value?.toString().toLowerCase().includes(lowerSearchTerm)
        })

        return topLevelMatches || detailMatches
      })
    }

    // Rating filter
    if (filterRating !== "all") {
      products = products.filter(product => {
        const rating = Number.parseFloat(product.details.Rating || "0")
        return rating >= Number.parseFloat(filterRating)
      })
    }

    // Sorting
    products.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.details.Title || a.name || "").localeCompare(b.details.Title || b.name || "")
        case "name-desc":
          return (b.details.Title || b.name || "").localeCompare(a.details.Title || a.name || "")
        case "price-asc":
          return Number.parseFloat(a.details["New Price"] || a.price) - Number.parseFloat(b.details["New Price"] || b.price)
        case "price-desc":
          return Number.parseFloat(b.details["New Price"] || b.price) - Number.parseFloat(a.details["New Price"] || a.price)
        case "rating-asc":
          return Number.parseFloat(a.details.Rating || "0") - Number.parseFloat(b.details.Rating || "0")
        case "rating-desc":
          return Number.parseFloat(b.details.Rating || "0") - Number.parseFloat(a.details.Rating || "0")
        default:
          return 0
      }
    })

    return products
  }, [websiteData, searchTerm, sortBy, filterRating])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Render star ratings
  const renderRating = (rating: string) => {
    if (!rating || rating === "0" || rating === "N/A" || isNaN(Number.parseFloat(rating))) {
      return (
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground">No ratings yet</span>
        </div>
      )
    }

    const ratingNum = Number.parseFloat(rating)
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

  // Render price information
  const renderPriceInfo = (product: Product) => {
    if (product.details["Price Range"] && product.details["Price Range"].length > 0) {
      const priceRange = product.details["Price Range"]
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
          {product.details["Previous Price"] && (
            <span className="text-sm line-through text-muted-foreground">
              {product.details["Previous Price"]}
            </span>
          )}
          <span className="text-lg font-bold text-red-500">
            {product.details["New Price"] || product.price}
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

    return (
      <div className="mt-2 flex items-center gap-2">
        {product.details["Previous Price"] && (
          <span className="text-sm line-through text-muted-foreground">
            {product.details["Previous Price"]}
          </span>
        )}
        <span className="text-lg font-bold text-red-500">{product.details["New Price"] || product.price}</span>
      </div>
    )
  }

  const downloadData = (format: "json" | "csv" | "excel" | "txt") => {
    if (filteredAndSortedProducts.length === 0) {
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
        content = JSON.stringify([{ url: websiteData[0]?.url, products: filteredAndSortedProducts }], null, 2)
        mimeType = "application/json"
        fileExtension = "json"
        break
      case "csv":
        const headers = [
          "Category URL",
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

        const rows = filteredAndSortedProducts.map((product) => {
          const priceRange = product.details["Price Range"] || []
          let minPrice = ""
          let maxPrice = ""
          let allPrices = ""

          if (priceRange && priceRange.length > 0) {
            const prices = priceRange.map((p) => Number.parseFloat(p.replace(/[^0-9.]/g, "")))
            minPrice = Math.min(...prices).toFixed(2)
            maxPrice = Math.max(...prices).toFixed(2)
            allPrices = priceRange.join(", ")
          }

          return [
            websiteData[0]?.url || "",
            product.details.Title || product.name || "Unknown",
            product.price,
            product.details["Previous Price"] || "",
            product.details["New Price"] || "",
            product.details.Rating || "",
            product.details["Customer Reviews"] || "",
            product.product_url,
            product.image_url,
            minPrice,
            maxPrice,
            allPrices,
          ]
            .map((value) => {
              if (value && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(",")
        })

        content = [headers.join(","), ...rows].join("\n")
        mimeType = "text/csv"
        fileExtension = "csv"
        break
      case "txt":
        const textLines = filteredAndSortedProducts.flatMap((product) => [
          `Category: ${websiteData[0]?.url || ""}`,
          `Title: ${product.details.Title || product.name || "Unknown Product"}`,
          `Price: ${product.price}`,
          ...(product.details["Previous Price"] ? [`Previous Price: ${product.details["Previous Price"]}`] : []),
          ...(product.details["New Price"] ? [`Sale Price: ${product.details["New Price"]}`] : []),
          `Rating: ${product.details.Rating || "N/A"}`,
          `Reviews: ${product.details["Customer Reviews"] || "0"}`,
          `URL: ${product.product_url}`,
          `Image: ${product.image_url}`,
          ...(product.details["Price Range"] && product.details["Price Range"].length > 0
            ? [`Price Options: ${product.details["Price Range"].join(", ")}`]
            : []),
          "\n-------------------\n",
        ])

        content = textLines.join("\n")
        mimeType = "text/plain"
        fileExtension = "txt"
        break
      case "excel":
        const excelHeaders = [
          "Category URL",
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

        const excelRows = filteredAndSortedProducts.map((product) => {
          const priceRange = product.details["Price Range"] || []
          let minPrice = ""
          let maxPrice = ""
          let allPrices = ""

          if (priceRange && priceRange.length > 0) {
            const prices = priceRange.map((p) => Number.parseFloat(p.replace(/[^0-9.]/g, "")))
            allPrices = priceRange.join(", ")
          }

          return [
            websiteData[0]?.url || "",
            product.details.Title || product.name || "Unknown",
            product.price,
            product.details["Previous Price"] || "",
            product.details["New Price"] || "",
            product.details.Rating || "",
            product.details["Customer Reviews"] || "",
            product.product_url,
            product.image_url,
            minPrice,
            maxPrice,
            allPrices,
          ]
            .map((value) => {
              if (value && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(",")
        })

        content = [excelHeaders.join(","), ...excelRows].join("\n")
        mimeType = "application/vnd.ms-excel"
        fileExtension = "csv"
        break
      default:
        content = JSON.stringify([{ url: websiteData[0]?.url, products: filteredAndSortedProducts }], null, 2)
        mimeType = "application/json"
        fileExtension = "json"
    }

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
        </div>
        <Button variant="outline" size="icon" onClick={fetchProductData} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search, Filter, and Sort Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium">Search Products</Label>
            <Input
              id="search"
              placeholder="Search by any parameter (name, price, rating, etc.)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="mt-1"
            />
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="sort" className="text-sm font-medium">Sort By</Label>
            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger id="sort" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="rating-asc">Rating (Low to High)</SelectItem>
                <SelectItem value="rating-desc">Rating (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="rating" className="text-sm font-medium">Minimum Rating</Label>
            <Select value={filterRating} onValueChange={(value) => {
              setFilterRating(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger id="rating" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="1">1 Star & Up</SelectItem>
                <SelectItem value="2">2 Stars & Up</SelectItem>
                <SelectItem value="3">3 Stars & Up</SelectItem>
                <SelectItem value="4">4 Stars & Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No products found matching your criteria</p>
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
                      {paginatedProducts.map((product, productIndex) => (
                        <Card key={productIndex} className="overflow-hidden">
                          <div className="relative">
                            {product.details["New Price"] && product.details["Previous Price"] && (
                              <Badge className="absolute top-2 right-2 bg-red-500">Sale!</Badge>
                            )}
                            <div className="h-48 overflow-hidden">
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.details.Title || "Product image"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                                }}
                              />
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold truncate">
                              {product.details.Title || product.name || "Unknown Product"}
                            </h3>
                            <div className="mt-1">
                              {renderRating(product.details.Rating || "0")}
                              <span className="text-xs text-muted-foreground">
                                ({product.details["Customer Reviews"] || "0"} reviews)
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
                {/* Pagination Controls */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="itemsPerPage" className="text-sm">Items per page:</Label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger id="itemsPerPage" className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="36">36</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
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
                      {paginatedProducts.map((product, productIndex) => (
                        <div key={productIndex} className="flex gap-4 p-4 border rounded-md">
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden relative">
                            {product.details["New Price"] && product.details["Previous Price"] && (
                              <Badge className="absolute top-0 right-0 z-10 bg-red-500 text-xs">Sale!</Badge>
                            )}
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.details.Title || "Product image"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=100&width=100"
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">
                              {product.details.Title || product.name || "Unknown Product"}
                            </h3>
                            <div className="mt-1">{renderRating(product.details.Rating || "0")}</div>
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
                {/* Pagination Controls */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="itemsPerPage" className="text-sm">Items per page:</Label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger id="itemsPerPage" className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="36">36</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
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
                      {paginatedProducts.map((product, productIndex) => (
                        <Accordion key={productIndex} type="single" collapsible className="border rounded-md">
                          <AccordionItem value={`product-${productIndex}`} className="border-none">
                            <AccordionTrigger className="px-4 py-2 hover:no-underline">
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-12 h-12 flex-shrink-0 overflow-hidden">
                                  <img
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.details.Title || "Product image"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg?height=50&width=50"
                                    }}
                                  />
                                </div>
                                <div>
                                  <h3 className="font-semibold">
                                    {product.details.Title || product.name || "Unknown Product"}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    {product.details["Previous Price"] && (
                                      <span className="text-sm line-through text-muted-foreground">
                                        {product.details["Previous Price"]}
                                      </span>
                                    )}
                                    <span className="text-sm font-bold text-red-500">
                                      {product.details["New Price"] || product.price}
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
                                    alt={product.details.Title || "Product image"}
                                    className="w-full h-auto object-cover rounded-md"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                                    }}
                                  />
                                  {product.details["Thumbnail Images"] &&
                                    product.details["Thumbnail Images"].length > 0 && (
                                      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                                        {product.details["Thumbnail Images"]
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
                                      {renderRating(product.details.Rating || "0")}
                                      <span className="ml-2 text-sm">
                                        ({product.details["Customer Reviews"] || "0"} reviews)
                                      </span>
                                    </div>
                                  </div>

                                  {product.details["Size Options"] &&
                                    product.details["Size Options"].length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Available Sizes</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {product.details["Size Options"]
                                            .filter((size) => size !== "Choose an option")
                                            .map((size, i) => (
                                              <Badge key={i} variant="outline" className="text-xs">
                                                {size}
                                              </Badge>
                                            ))}
                                        </div>
                                      </div>
                                    )}

                                  {product.details["Product Specification"] &&
                                    product.details["Product Specification"].length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Specifications</h4>
                                        <ul className="list-disc pl-5 text-sm mt-1">
                                          {product.details["Product Specification"].map((spec, i) => (
                                            <li key={i}>{spec}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                  {product.details["Price Range"] &&
                                    product.details["Price Range"].length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Price Options</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {product.details["Price Range"].map((price, i) => (
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
                {/* Pagination Controls */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="itemsPerPage" className="text-sm">Items per page:</Label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger id="itemsPerPage" className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="36">36</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="json">
              <ScrollArea className="h-[500px]">
                <pre className="text-xs p-4 bg-muted rounded-md overflow-x-auto">
                  {JSON.stringify([{ url: websiteData[0]?.url, products: filteredAndSortedProducts }], null, 2)}
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
          disabled={isLoading || filteredAndSortedProducts.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadData("csv")}
          disabled={isLoading || filteredAndSortedProducts.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadData("excel")}
          disabled={isLoading || filteredAndSortedProducts.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadData("txt")}
          disabled={isLoading || filteredAndSortedProducts.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Text
        </Button>
      </CardFooter>
    </Card>
  )
}