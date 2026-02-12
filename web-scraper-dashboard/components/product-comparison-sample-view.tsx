"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Calendar,
  Package,
  ExternalLink,
  Eye,
  Info,
  Star,
  StarHalf,
} from "lucide-react"
import { sampleRealComparisonData } from "@/lib/sample-real-data"

export function ProductComparisonSampleView() {
  const [activeTab, setActiveTab] = useState("updated")
  const comparisonData = sampleRealComparisonData

  const renderRating = (rating: string | null) => {
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

  const totalChanges = comparisonData.new.length + comparisonData.updated.length + comparisonData.removed.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Comparison - Sample View</CardTitle>
        <CardDescription>
          {totalChanges} changes detected with your actual data structure
          <br />
          <span className="text-xs text-muted-foreground">
            This demonstrates the table format for updated products with timestamps and detailed comparisons
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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

            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {comparisonData.updated.slice(0, 2).map((product, index) => (
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
                                      <div className="flex items-center gap-2">
                                        <span className="line-through text-muted-foreground">${change.old}</span>
                                        <span className="font-semibold">${change.new}</span>
                                        <div className="flex items-center gap-1">
                                          {Number.parseFloat(change.new) > Number.parseFloat(change.old) ? (
                                            <TrendingUp className="h-3 w-3 text-red-500" />
                                          ) : (
                                            <TrendingDown className="h-3 w-3 text-green-500" />
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="ml-1">Details updated</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new">
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comparisonData.new.map((product, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="relative">
                      <Badge className="absolute top-2 right-2 bg-green-500">New Product</Badge>
                      <div className="h-48 overflow-hidden">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.details?.Title || product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                          }}
                        />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm truncate">{product.details?.Title || product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{product.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-green-600">${product.price}</span>
                      </div>
                      {product.details?.Rating && <div className="mt-2">{renderRating(product.details.Rating)}</div>}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(product.change_date).toLocaleString()}</span>
                      </div>
                      {/* <a
                        href={product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 text-blue-500 hover:underline mt-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Product
                      </a> */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="updated">
            <ScrollArea className="h-[600px]">
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
                      {/* Comparison Table */}
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
                            {/* Price Row */}
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
                                          <div className={`text-xs ${isIncrease ? "text-red-500" : "text-green-500"}`}>
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

                            {/* Product Details Rows */}
                            {product.details &&
                              Object.entries(product.details).map(([key, value]) => {
                                // Skip certain fields that are handled separately
                                if (key === "Image URL" || key === "Previous Price" || key === "New Price") return null

                                const hasChange =
                                  product.changes?.details &&
                                  product.changes.details.old &&
                                  (product.changes.details.old as Record<string, unknown>)[key] !== undefined

                                const oldValue = hasChange ? (product.changes.details.old as Record<string, unknown>)[key] : "Not available"
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
                                        {hasChange && product.changes.details.old_date && (
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
                                          {new Date(product.change_date).toLocaleString()}
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

                            {/* Thumbnail Images Row */}
                            {product.details?.["Thumbnail Images"] && (
                              <tr className="hover:bg-gray-50">
                                <td className="border border-gray-200 px-4 py-3 font-medium">Thumbnail Images</td>
                                <td className="border border-gray-200 px-4 py-3 bg-red-50">
                                  <div className="space-y-1">
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                      {product.changes?.details?.old?.["Thumbnail Images"] ? (
                                        product.changes.details.old["Thumbnail Images"].map((img, i) => (
                                          <img
                                            key={i}
                                            src={img || "/placeholder.svg"}
                                            alt={`Previous thumbnail ${i + 1}`}
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
                                      {new Date(product.change_date).toLocaleString()}
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

                      {/* Summary Section */}
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
                            <div className="text-gray-600">{new Date(product.change_date).toLocaleString()}</div>
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
            </ScrollArea>
          </TabsContent>

          <TabsContent value="removed">
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comparisonData.removed.map((product, index) => (
                  <Card key={index} className="overflow-hidden opacity-75">
                    <div className="relative">
                      <Badge className="absolute top-2 right-2 bg-red-500">Removed</Badge>
                      <div className="h-48 overflow-hidden">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.details?.Title || product.name}
                          className="w-full h-full object-cover grayscale"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                          }}
                        />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm truncate">{product.details?.Title || product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{product.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-muted-foreground">${product.price}</span>
                      </div>
                      {product.details?.Rating && <div className="mt-2">{renderRating(product.details.Rating)}</div>}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Removed: {new Date(product.change_date).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-muted-foreground">
          This sample view demonstrates the table format with your actual data structure including timestamps, price
          changes, and detailed product comparisons.
        </div>
      </CardFooter>
    </Card>
  )
}
