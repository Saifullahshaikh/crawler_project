"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, RefreshCw, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CategoryLinks() {
  const [categoryLinks, setCategoryLinks] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchCategoryLinks = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/categories/")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch category links")
      }

      setCategoryLinks(data.categoryLinks || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch category links",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategoryLinks()
  }, [])

  const downloadLinks = (format: "json" | "csv" | "txt") => {
    if (categoryLinks.length === 0) {
      toast({
        title: "No data to download",
        description: "There are no category links available to download",
        variant: "destructive",
      })
      return
    }

    let content: string
    let mimeType: string
    let fileExtension: string

    switch (format) {
      case "json":
        content = JSON.stringify(categoryLinks, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
        break
      case "csv":
        // Create CSV content with a header
        content = "Category URL\n" + categoryLinks.map((link) => `"${link}"`).join("\n")
        mimeType = "text/csv"
        fileExtension = "csv"
        break
      case "txt":
        content = categoryLinks.join("\n")
        mimeType = "text/plain"
        fileExtension = "txt"
        break
      default:
        content = JSON.stringify(categoryLinks, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
    }

    // Create a blob and download it
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `category-links.${fileExtension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: `Downloading category links as ${format.toUpperCase()}`,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Category Links</CardTitle>
          <CardDescription>Found {categoryLinks.length} category links</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchCategoryLinks} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : categoryLinks.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No category links found</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <ul className="space-y-2">
              {categoryLinks.map((link, index) => (
                <li key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadLinks("json")}
          disabled={isLoading || categoryLinks.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadLinks("csv")}
          disabled={isLoading || categoryLinks.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadLinks("txt")}
          disabled={isLoading || categoryLinks.length === 0}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Text
        </Button>
      </CardFooter>
    </Card>
  )
}
