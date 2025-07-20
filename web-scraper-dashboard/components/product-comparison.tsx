"use client"

import { useState, useEffect, Key } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Star,
  StarHalf,
  Search,
  ExternalLink,
  Calendar,
  Package,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { serverConfig } from "@/lib/config"
import { useSessionStore } from "@/lib/session-store"

interface ProductDetails {
  "Image URL"?: string
  "Thumbnail Images"?: string[]
  Title?: string
  Rating?: string
  "Customer Reviews"?: string
  "Size Options"?: string[]
  "Product Specification"?: string[]
  "Previous Price"?: string
  "New Price"?: string
  "Price Range"?: string[]
  [key: string]: any
}

interface ProductChangeData {
  name: string
  price: string
  product_url: string
  image_url: string
  details: ProductDetails
  category: string
  crawl_job_id?: string
  created_at?: string
  changes?: {
    [field: string]: {
      old_date: string | number | Date
      change_date: string | number | Date
      old: any
      new: any
    }
  }
  change_date?: string
}

interface Pagination {
  total: number
  num_pages: number
  current_page: number
  has_next: boolean
  has_previous: boolean
}

interface ComparisonData {
  new: ProductChangeData[]
  updated: ProductChangeData[]
  removed: ProductChangeData[]
  pagination: Pagination
  job_info?: {
    id: string
    urls: string[]
    completed_at: string
    total_products: number
  }
}

export function ProductComparison({
  refreshTrigger,
  completedJobId,
}: {
  refreshTrigger: number
  completedJobId?: string
}) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [jobId, setJobId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [currentJobId, setCurrentJobId] = useState<string>("")
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const { toast } = useToast()
  const { activeUserSession } = useSessionStore()

  const fetchComparisonData = async (specificJobId?: string, page: number = 1, start?: string, end?: string) => {
    setIsLoading(true)

    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/product-changes/`)
      if (specificJobId || activeUserSession?.job_id) {
        url.searchParams.append('jobId', specificJobId || activeUserSession?.job_id || '')
      }
      url.searchParams.append('page', page.toString())
      url.searchParams.append('per_page', perPage.toString())
      if (start) {
        url.searchParams.append('start_date', start)
      }
      if (end) {
        url.searchParams.append('end_date', end)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch comparison data")
      }

      setComparisonData(data || null)
      setCurrentJobId(specificJobId || "")
      setCurrentPage(data.pagination.current_page)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch comparison data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (completedJobId) {
      setJobId(completedJobId)
      fetchComparisonData(completedJobId, 1, startDate, endDate)
      toast({
        title: "Comparison Updated",
        description: `Showing changes for completed job: ${completedJobId}`,
      })
    }
  }, [completedJobId])

  useEffect(() => {
    if (!completedJobId) {
      fetchComparisonData(undefined, 1, startDate, endDate)
    }
  }, [refreshTrigger])

  const handleJobIdSearch = () => {
    if (jobId.trim() || startDate || endDate) {
      fetchComparisonData(jobId.trim(), 1, startDate, endDate)
    } else {
      fetchComparisonData(undefined, 1, startDate, endDate)
    }
  }

  const clearFilters = () => {
    setJobId("")
    setStartDate("")
    setEndDate("")
    setCurrentJobId("")
    setCurrentPage(1)
    fetchComparisonData(undefined, 1)
  }

  const handlePageChange = (newPage: number) => {
    fetchComparisonData(currentJobId || undefined, newPage, startDate, endDate)
  }

  const toggleExpanded = (key: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

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
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
        <span className="ml-1 text-xs text-muted-foreground">({rating})</span>
      </div>
    )
  }

  const renderPriceChange = (change: { old: string; new: string }) => {
    const oldPrice = Number.parseFloat(change.old.replace(/[^0-9.]/g, "") || "0")
    const newPrice = Number.parseFloat(change.new.replace(/[^0-9.]/g, "") || "0")
    const difference = newPrice - oldPrice
    const percentChange = oldPrice > 0 ? ((difference / oldPrice) * 100).toFixed(1) : "0"
    const isIncrease = difference > 0

    return (
      <div className="flex items-center gap-2">
        <span className="line-through text-muted-foreground text-sm">{change.old}</span>
        <span className="font-semibold">{change.new}</span>
        <div className="flex items-center gap-1">
          {isIncrease ? (
            <TrendingUp className="h-4 w-4 text-red-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-green-500" />
          )}
          <span className={`text-sm ${isIncrease ? "text-red-500" : "text-green-500"}`}>
            {isIncrease ? "+" : ""}
            {percentChange}%
          </span>
        </div>
      </div>
    )
  }

  const renderDetailedChanges = (changes: any) => {
    if (!changes || Object.keys(changes).length === 0) return null

    return (
      <div className="space-y-3">
        {Object.entries(changes).map(([field, change]: [string, any]) => (
          <div key={field} className="border rounded-lg pss-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {field.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>

            {field === "price" ? (
              renderPriceChange(change)
            ) : field === "details" ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Product Details Changed:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Previous Details:</div>
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-xs max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(change.old, null, 2)}</pre>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">New Details:</div>
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-xs max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(change.new, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="line-through text-muted-foreground">{String(change.old)}</span>
                <span>→</span>
                <span className="font-medium">{String(change.new)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderProductDetails = (details: ProductDetails) => {
    if (!details || Object.keys(details).length === 0) return null

    return (
      <div className="space-y-3">
        {details.Title && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Title:</span>
            <p className="text-sm">{details.Title}</p>
          </div>
        )}

        {details.Rating && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Rating:</span>
            <div className="mt-1">{renderRating(details.Rating)}</div>
          </div>
        )}

        {details["Customer Reviews"] && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Reviews:</span>
            <p className="text-sm">{details["Customer Reviews"]} reviews</p>
          </div>
        )}

        {details["Previous Price"] && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Previous Price:</span>
            <p className="text-sm line-through text-red-500">{details["Previous Price"]}</p>
          </div>
        )}

        {details["New Price"] && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Current Price:</span>
            <p className="text-sm font-semibold text-green-600">{details["New Price"]}</p>
          </div>
        )}

        {details["Size Options"] && details["Size Options"].length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Available Sizes:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {details["Size Options"]
                .filter((size) => size !== "Choose an option")
                .map((size, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {size}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {details["Product Specification"] && details["Product Specification"].length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Specifications:</span>
            <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
              {details["Product Specification"].slice(0, 5).map((spec, i) => (
                <li key={i}>{spec}</li>
              ))}
              {details["Product Specification"].length > 5 && (
                <li className="text-muted-foreground">
                  +{details["Product Specification"].length - 5} more specifications
                </li>
              )}
            </ul>
          </div>
        )}

        {details["Price Range"] && details["Price Range"].length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Price Options:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {details["Price Range"].slice(0, 3).map((price, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {price}
                </Badge>
              ))}
              {details["Price Range"].length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{details["Price Range"].length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {details["Thumbnail Images"] && details["Thumbnail Images"].length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Additional Images:</span>
            <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
              {details["Thumbnail Images"]
                .filter((img) => !img.includes("svg+xml"))
                .slice(0, 4)
                .map((img, i) => (
                  <img
                    key={i}
                    src={img || "/placeholder.svg"}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-12 h-12 object-cover rounded border flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderDetailedProductCard = (product: ProductChangeData, changeType: "new" | "updated" | "removed") => {
    const cardKey = `${changeType}-${product.product_url}`
    const isExpanded = expandedItems[cardKey]

    const getBadgeColor = () => {
      switch (changeType) {
        case "new":
          return "bg-green-500"
        case "updated":
          return "bg-blue-500"
        case "removed":
          return "bg-red-500"
        default:
          return "bg-gray-500"
      }
    }

    const getBadgeText = () => {
      switch (changeType) {
        case "new":
          return "New Product"
        case "updated":
          return "Updated"
        case "removed":
          return "Removed"
        default:
          return "Unknown"
      }
    }

    return (
      <Card key={cardKey} className={`overflow-hidden ${changeType === "removed" ? "opacity-75" : ""}`}>
        <div className="relative">
          <Badge className={`absolute top-2 right-2 ${getBadgeColor()}`}>{getBadgeText()}</Badge>
          <div className="h-48 overflow-hidden">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.details?.Title || product.name}
              className={`w-full h-full object-cover ${changeType === "removed" ? "grayscale" : ""}`}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=200&width=300"
              }}
            />
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm truncate">{product.details?.Title || product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Package className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{product.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                {product.details?.["Previous Price"] && (
                  <span className="text-sm line-through text-muted-foreground">
                    {product.details["Previous Price"]}
                  </span>
                )}
                <span
                  className={`text-lg font-bold ${changeType === "removed" ? "text-muted-foreground" : "text-green-600"}`}
                >
                  {product.details?.["New Price"] || product.price}
                </span>
              </div>
            </div>

            {product.details?.Rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                {renderRating(product.details.Rating)}
              </div>
            )}

            {changeType === "updated" && product.changes && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-xs font-medium text-blue-800 mb-1">Changes Detected:</div>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(product.changes).map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {field.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {product.created_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(product.created_at).toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View Product
              </a>

              <Button variant="ghost" size="sm" onClick={() => toggleExpanded(cardKey)} className="h-6 px-2 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                {isExpanded ? "Less" : "Details"}
                {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>

            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(cardKey)}>
              <CollapsibleContent>
                <Separator className="my-3" />
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Product Details
                    </div>
                    {renderProductDetails(product.details)}
                  </div>

                  {changeType === "updated" && product.changes && (
                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Detailed Changes
                      </div>
                      {renderDetailedChanges(product.changes)}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
    )
  }

  const downloadComparison = (format: "json" | "csv" | "txt") => {
    if (!comparisonData) {
      toast({
        title: "No data to download",
        description: "There is no comparison data available to download",
        variant: "destructive",
      })
      return
    }

    let content: string
    let mimeType: string
    let fileExtension: string

    switch (format) {
      case "json":
        content = JSON.stringify(comparisonData, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
        break
      case "csv":
        const headers = [
          "Change Type",
          "Product Name",
          "Category",
          "Product URL",
          "Current Price",
          "Previous Price",
          "Rating",
          "Reviews",
          "Field Changed",
          "Old Value",
          "New Value",
          "Created At",
          "Job ID",
        ]

        const rows = []

        for (const product of comparisonData.new) {
          rows.push([
            "New Product",
            product.details?.Title || product.name,
            product.category,
            product.product_url,
            product.details?.["New Price"] || product.price,
            product.details?.["Previous Price"] || "",
            product.details?.Rating || "",
            product.details?.["Customer Reviews"] || "",
            "N/A",
            "N/A",
            "N/A",
            product.created_at || "",
            product.crawl_job_id || "",
          ])
        }

        for (const product of comparisonData.updated) {
          if (product.changes) {
            for (const [field, change] of Object.entries(product.changes)) {
              rows.push([
                "Updated Product",
                product.name,
                product.category,
                product.product_url,
                product.price,
                "",
                "",
                "",
                field,
                typeof change.old === "object" ? JSON.stringify(change.old) : String(change.old),
                typeof change.new === "object" ? JSON.stringify(change.new) : String(change.new),
                product.created_at || "",
                product.crawl_job_id || "",
              ])
            }
          }
        }

        for (const product of comparisonData.removed) {
          rows.push([
            "Removed Product",
            product.details?.Title || product.name,
            product.category,
            product.product_url,
            product.details?.["New Price"] || product.price,
            product.details?.["Previous Price"] || "",
            product.details?.Rating || "",
            product.details?.["Customer Reviews"] || "",
            "N/A",
            "N/A",
            "N/A",
            product.created_at || "",
            product.crawl_job_id || "",
          ])
        }

        content = [
          headers.join(","),
          ...rows.map((row) =>
            row
              .map((value) => {
                if (value && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
                  return `"${value.replace(/"/g, '""')}"`
                }
                return value
              })
              .join(","),
          ),
        ].join("\n")
        mimeType = "text/csv"
        fileExtension = "csv"
        break
      case "txt":
        const textLines = []
        textLines.push(`DETAILED PRODUCT COMPARISON REPORT`)
        textLines.push(`Generated: ${new Date().toLocaleString()}`)
        if (currentJobId) {
          textLines.push(`Job ID: ${currentJobId}`)
        }
        if (startDate) {
          textLines.push(`Start Date: ${startDate}`)
        }
        if (endDate) {
          textLines.push(`End Date: ${endDate}`)
        }
        if (comparisonData.job_info) {
          textLines.push(`Crawled URLs: ${comparisonData.job_info.urls.join(", ")}`)
          textLines.push(`Total Products: ${comparisonData.job_info.total_products}`)
          textLines.push(`Completed: ${new Date(comparisonData.job_info.completed_at).toLocaleString()}`)
        }
        textLines.push(
          `Total Changes: ${comparisonData.new.length + comparisonData.updated.length + comparisonData.removed.length}`,
        )
        textLines.push("\n" + "=".repeat(80) + "\n")

        if (comparisonData.new.length > 0) {
          textLines.push(`NEW PRODUCTS (${comparisonData.new.length}):`)
          textLines.push("-".repeat(50))
          for (const product of comparisonData.new) {
            textLines.push(`• ${product.details?.Title || product.name}`)
            textLines.push(`  Category: ${product.category}`)
            textLines.push(`  Price: ${product.details?.["New Price"] || product.price}`)
            textLines.push(`  Rating: ${product.details?.Rating || "N/A"}`)
            textLines.push(`  Reviews: ${product.details?.["Customer Reviews"] || "0"}`)
            textLines.push(`  URL: ${product.product_url}`)
            if (product.created_at) {
              textLines.push(`  Added: ${new Date(product.created_at).toLocaleString()}`)
            }
            textLines.push("")
          }
        }

        if (comparisonData.updated.length > 0) {
          textLines.push(`UPDATED PRODUCTS (${comparisonData.updated.length}):`)
          textLines.push("-".repeat(50))
          for (const product of comparisonData.updated) {
            textLines.push(`• ${product.name}`)
            textLines.push(`  Category: ${product.category}`)
            textLines.push(`  Current Price: ${product.price}`)
            if (product.changes) {
              textLines.push(`  Changes:`)
              for (const [field, change] of Object.entries(product.changes)) {
                if (field === "details") {
                  textLines.push(`    - ${field}: Product details updated`)
                } else {
                  textLines.push(`    - ${field}: ${change.old} → ${change.new}`)
                }
              }
            }
            textLines.push(`  URL: ${product.product_url}`)
            if (product.created_at) {
              textLines.push(`  Updated: ${new Date(product.created_at).toLocaleString()}`)
            }
            textLines.push("")
          }
        }

        if (comparisonData.removed.length > 0) {
          textLines.push(`REMOVED PRODUCTS (${comparisonData.removed.length}):`)
          textLines.push("-".repeat(50))
          for (const product of comparisonData.removed) {
            textLines.push(`• ${product.details?.Title || product.name}`)
            textLines.push(`  Category: ${product.category}`)
            textLines.push(`  Last Price: ${product.details?.["New Price"] || product.price}`)
            textLines.push(`  Last Rating: ${product.details?.Rating || "N/A"}`)
            textLines.push(`  URL: ${product.product_url}`)
            textLines.push("")
          }
        }

        content = textLines.join("\n")
        mimeType = "text/plain"
        fileExtension = "txt"
        break
      default:
        content = JSON.stringify(comparisonData, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `product-comparison-${currentJobId || "latest"}-${startDate || "no-start"}-${endDate || "no-end"}.${fileExtension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: `Downloading comparison data as ${format.toUpperCase()}`,
    })
  }

  const totalChanges = comparisonData
    ? comparisonData.new.length + comparisonData.updated.length + comparisonData.removed.length
    : 0

  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true)
    }, 30000)

    return () => clearTimeout(timer)
  }, [])

  const renderPaginationControls = () => {
    if (!comparisonData?.pagination) return null

    const { current_page, num_pages, has_next, has_previous } = comparisonData.pagination

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Page {current_page} of {num_pages} (Total: {comparisonData.pagination.total} changes)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!has_previous || isLoading}
            onClick={() => handlePageChange(current_page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!has_next || isLoading}
            onClick={() => handlePageChange(current_page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Detailed Product Changes</CardTitle>
          <CardDescription>
            {comparisonData ? (
              <>
                {totalChanges} changes detected with full product details
                {currentJobId && (
                  <>
                    <br />
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">Job: {currentJobId}</span>
                  </>
                )}
                {(startDate || endDate) && (
                  <>
                    <br />
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {startDate ? `From: ${startDate}` : ""} {endDate ? `To: ${endDate}` : ""}
                    </span>
                  </>
                )}
                {comparisonData.job_info && (
                  <>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {comparisonData.job_info.total_products} total products • Completed{" "}
                      {new Date(comparisonData.job_info.completed_at).toLocaleString()}
                    </span>
                  </>
                )}
              </>
            ) : (
              "Compare products with previous crawl results - showing comprehensive details"
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {(currentJobId || startDate || endDate) && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
              Clear Filters
            </Button>
          )}
          <div className="relative inline-block">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                fetchComparisonData(currentJobId || undefined, currentPage, startDate, endDate)
                setShowTooltip(false)
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            {showTooltip && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-10 w-max bg-gray-800 text-white text-sm px-3 py-2 rounded shadow-lg animate-fadeIn">
                Refresh to see latest changes
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!completedJobId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="jobId" className="text-sm font-medium">
                Job ID (optional)
              </Label>
              <Input
                id="jobId"
                placeholder="Enter job ID..."
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium">
                Start Date (YYYY-MM-DD)
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date (YYYY-MM-DD)
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}
        {!completedJobId && (
          <div className="flex justify-end mb-4">
            <Button onClick={handleJobIdSearch} disabled={isLoading} className="gap-2">
              <Search className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !comparisonData ? (
          <p className="text-center py-8 text-muted-foreground">
            No comparison data available. Complete a crawl to see detailed changes.
          </p>
        ) : totalChanges === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No changes detected.</p>
        ) : (
          <>
            <Tabs defaultValue="summary">
              <TabsList className="mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="new">New ({comparisonData.new.length})</TabsTrigger>
                <TabsTrigger value="updated">Updated ({comparisonData.updated.length})</TabsTrigger>
                <TabsTrigger value="removed">Removed ({comparisonData.removed.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Plus className="h-5 w-5 text-green-500" />
                        <span className="text-2xl font-bold text-green-500">{comparisonData.new.length}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">New Products</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <span className="text-2xl font-bold text-blue-500">{comparisonData.updated.length}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Updated Products</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Minus className="h-5 w-5 text-red-500" />
                        <span className="text-2xl font-bold text-red-500">{comparisonData.removed.length}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Removed Products</p>
                    </CardContent>
                  </Card>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {comparisonData.updated.slice(0, 3).map((product, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{product.name}</h4>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                            <div className="mt-2 space-y-1">
                              {product.changes &&
                                Object.entries(product.changes)
                                  .slice(0, 2)
                                  .map(([field, change]) => (
                                    <div key={field} className="text-xs">
                                      <span className="font-medium capitalize">{field}:</span>
                                      <div className="mt-1">
                                        {field === "price" ? (
                                          renderPriceChange(change)
                                        ) : (
                                          <span className="ml-1">
                                            {typeof change.old === "object" ? "Details" : String(change.old)} →{" "}
                                            {typeof change.new === "object" ? "Updated" : String(change.new)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {comparisonData.updated.length > 3 && (
                      <p className="text-center text-sm text-muted-foreground">
                        And {comparisonData.updated.length - 3} more updated products...
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="new">
                <ScrollArea className="h-[600px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {comparisonData.new.map((product, index) => renderDetailedProductCard(product, "new"))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="updated">
                <ScrollArea className="h-[600px]">
                  {comparisonData.updated.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No updated products found</p>
                  ) : (
                    <div className="space-y-6">
                      {comparisonData.updated.map((product, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.details?.["Image URL"] || product.image_url || "/placeholder.svg"}
                                alt={product.details?.Title || product.name}
                                className="w-16 h-16 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                                }}
                              />
                              <div className="flex-1">
                                <CardTitle className="text-lg">{product.details?.Title || product.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  {product.category}
                                  <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                                    Updated
                                  </Badge>
                                </CardDescription>
                                <div className="flex items-center gap-2 mt-1">
                                  <ExternalLink className="h-3 w-3" />
                                  <a
                                    href={product.product_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline truncate"
                                  >
                                    {product.product_url}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-gray-200 rounded-lg">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                                      Field
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-red-700">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Previous Data
                                      </div>
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-green-700">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Current Data
                                      </div>
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-blue-700">
                                      Change
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.changes?.price && (
                                    <tr className="hover:bg-gray-50">
                                      <td className="border border-gray-200 px-4 py-3 font-medium">Price</td>
                                      <td className="border border-gray-200 px-4 py-3 bg-red-50">
                                        <div className="space-y-1">
                                          <div className="text-lg font-semibold text-red-700">
                                            ${product.changes.price.old}
                                          </div>
                                          <div className="text-xs text-red-600 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(product.changes.price.old_date).toLocaleString()}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="border border-gray-200 px-4 py-3 bg-green-50">
                                        <div className="space-y-1">
                                          <div className="text-lg font-semibold text-green-700">
                                            ${product.changes.price.new}
                                          </div>
                                          <div className="text-xs text-green-600 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(product.changes.price.change_date).toLocaleString()}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="border border-gray-200 px-4 py-3">
                                        {(() => {
                                          const oldPrice = Number.parseFloat(product.changes.price.old)
                                          const newPrice = Number.parseFloat(product.changes.price.new)
                                          const difference = newPrice - oldPrice
                                          const percentChange =
                                            oldPrice > 0 ? ((difference / oldPrice) * 100).toFixed(1) : "0"
                                          const isIncrease = difference > 0

                                          return (
                                            <div className="flex items-center gap-2">
                                              {isIncrease ? (
                                                <TrendingUp className="h-4 w-4 text-red-500" />
                                              ) : (
                                                <TrendingDown className="h-4 w-4 text-green-500" />
                                              )}
                                              <div className="text-sm">
                                                <div
                                                  className={`font-semibold ${isIncrease ? "text-red-600" : "text-green-600"}`}
                                                >
                                                  {isIncrease ? "+" : ""}${difference.toFixed(2)}
                                                </div>
                                                <div
                                                  className={`text-xs ${isIncrease ? "text-red-500" : "text-green-500"}`}
                                                >
                                                  {isIncrease ? "+" : ""}
                                                  {percentChange}%
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        })()}
                                      </td>
                                    </tr>
                                  )}

                                  {product.details &&
                                    Object.entries(product.details).map(([key, value]) => {
                                      if (key === "Image URL" || key === "Previous Price" || key === "New Price")
                                        return null

                                      const hasChange =
                                        product.changes?.details &&
                                        product.changes.details.old &&
                                        product.changes.details.old[key] !== undefined

                                      const oldValue = hasChange ? product.changes?.details?.old?.[key] : "Not available"
                                      const newValue = value

                                      return (
                                        <tr key={key} className="hover:bg-gray-50">
                                          <td className="border border-gray-200 px-4 py-3 font-medium">
                                            {key.replace(/([A-Z])/g, " $1").trim()}
                                          </td>
                                          <td className="border border-gray-200 px-4 py-3 bg-red-50">
                                            <div className="space-y-1">
                                              <div className="text-sm">
                                                {Array.isArray(oldValue) ? (
                                                  <div className="space-y-1">
                                                    {oldValue.length > 0 ? (
                                                      oldValue.map((item, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs mr-1 mb-1">
                                                          {item}
                                                        </Badge>
                                                      ))
                                                    ) : (
                                                      <span className="text-gray-500 italic">No items</span>
                                                    )}
                                                  </div>
                                                ) : oldValue === null ? (
                                                  <span className="text-gray-500 italic">Not available</span>
                                                ) : (
                                                  <span>{String(oldValue)}</span>
                                                )}
                                              </div>
                                              {hasChange && product.changes?.details?.old_date && (
                                                <div className="text-xs text-red-600 flex items-center gap-1">
                                                  <Calendar className="h-3 w-3" />
                                                  {new Date(product.changes.details.old_date).toLocaleString()}
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="border border-gray-200 px-4 py-3 bg-green-50">
                                            <div className="space-y-1">
                                              <div className="text-sm">
                                                {Array.isArray(newValue) ? (
                                                  <div className="space-y-1">
                                                    {newValue.length > 0 ? (
                                                      newValue.map((item, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs mr-1 mb-1">
                                                          {item}
                                                        </Badge>
                                                      ))
                                                    ) : (
                                                      <span className="text-gray-500 italic">No items</span>
                                                    )}
                                                  </div>
                                                ) : newValue === null ? (
                                                  <span className="text-gray-500 italic">Not available</span>
                                                ) : (
                                                  <span>{String(newValue)}</span>
                                                )}
                                              </div>
                                              <div className="text-xs text-green-600 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {product.change_date ? new Date(product.change_date).toLocaleString() : "N/A"}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="border border-gray-200 px-4 py-3">
                                            {hasChange ? (
                                              <div className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3 text-blue-500" />
                                                <span className="text-xs text-blue-600">Modified</span>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-1">
                                                <Plus className="h-3 w-3 text-green-500" />
                                                <span className="text-xs text-green-600">Added</span>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    })}

                                  {product.details?.["Thumbnail Images"] && (
                                    <tr className="hover:bg-gray-50">
                                      <td className="border border-gray-200 px-4 py-3 font-medium">Thumbnail Images</td>
                                      <td className="border border-gray-200 px-4 py-3 bg-red-50">
                                        <div className="space-y-1">
                                          <div className="flex gap-2 overflow-x-auto pb-2">
                                            {product.changes?.details?.old?.["Thumbnail Images"] ? (
                                              product.changes.details.old["Thumbnail Images"].map((img: any, idx: number) => (
                                                <img
                                                  key={idx}
                                                  src={img || "/placeholder.svg"}
                                                  alt={`Previous thumbnail ${idx + 1}`}
                                                  className="w-12 h-12 object-cover rounded border flex-shrink-0"
                                                  onError={(e) => {
                                                    e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                                                  }}
                                                />
                                              ))
                                            ) : (
                                              <span className="text-gray-500 italic text-sm">No previous images</span>
                                            )}
                                          </div>
                                          {product.changes?.details?.old_date && (
                                            <div className="text-xs text-red-600 flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              {new Date(product.changes.details.old_date).toLocaleString()}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="border border-gray-200 px-4 py-3 bg-green-50">
                                        <div className="space-y-1">
                                          <div className="flex gap-2 overflow-x-auto pb-2">
                                            {product.details["Thumbnail Images"].map((img, i) => (
                                              <img
                                                key={i}
                                                src={img || "/placeholder.svg"}
                                                alt={`Current thumbnail ${i + 1}`}
                                                className="w-12 h-12 object-cover rounded border flex-shrink-0"
                                                onError={(e) => {
                                                  e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                                                }}
                                              />
                                            ))}
                                          </div>
                                          <div className="text-xs text-green-600 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {product.change_date ? new Date(product.change_date).toLocaleString() : "N/A"}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="border border-gray-200 px-4 py-3">
                                        <div className="flex items-center gap-1">
                                          <Eye className="h-3 w-3 text-blue-500" />
                                          <span className="text-xs text-blue-600">
                                            {product.changes?.details?.old?.["Thumbnail Images"] ? "Updated" : "Added"}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-4 pt-4 border-t bg-blue-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium text-blue-700">Change Summary</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Product:</span>
                                  <div className="text-gray-600">{product.name}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Last Updated:</span>
                                  <div className="text-gray-600">
                                    {product.change_date ? new Date(product.change_date).toLocaleString() : "N/A"}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Changes Detected:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {product.changes &&
                                      Object.keys(product.changes).map((field) => (
                                        <Badge key={field} variant="outline" className="text-xs">
                                          {field.replace(/_/g, " ")}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="removed">
                <ScrollArea className="h-[600px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {comparisonData.removed.map((product, index) => renderDetailedProductCard(product, "removed"))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            {renderPaginationControls()}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadComparison("json")}
          disabled={isLoading || !comparisonData}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Detailed JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadComparison("csv")}
          disabled={isLoading || !comparisonData}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Detailed CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadComparison("txt")}
          disabled={isLoading || !comparisonData}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Full Report
        </Button>
      </CardFooter>
    </Card>
  )
}