"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Copy, ExternalLink, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useScrapingStore } from "@/lib/store"

interface UrlManagerProps {
  onUrlSelect?: (url: string) => void
  onMultipleUrlSelect?: (urls: string[]) => void
}

export function UrlManager({ onUrlSelect, onMultipleUrlSelect }: UrlManagerProps) {
  const [newUrl, setNewUrl] = useState("")
  const [isAddingUrl, setIsAddingUrl] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const { savedUrls, addSavedUrl, removeSavedUrl, initializeDefaultUrls } = useScrapingStore()
  const { toast } = useToast()

  // Initialize default URLs on component mount
  useEffect(() => {
    if (initializeDefaultUrls && typeof initializeDefaultUrls === "function") {
      initializeDefaultUrls()
    }
  }, [initializeDefaultUrls])

  const handleAddUrl = () => {
    if (!newUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    try {
      new URL(newUrl) // Validate URL format
      addSavedUrl(newUrl.trim())
      setNewUrl("")
      setIsAddingUrl(false)
      toast({
        title: "URL Added",
        description: "URL has been added to your saved list",
      })
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL format",
        variant: "destructive",
      })
    }
  }

  const handleCancelAdd = () => {
    setNewUrl("")
    setIsAddingUrl(false)
  }

  const handleRemoveUrl = (url: string) => {
    removeSavedUrl(url)
    setSelectedUrls(selectedUrls.filter((u) => u !== url))
    toast({
      title: "URL Removed",
      description: "URL has been removed from your saved list",
    })
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL Copied",
      description: "URL has been copied to clipboard",
    })
  }

  const handleUrlToggle = (url: string) => {
    setSelectedUrls((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]))
  }

  const handleSelectAll = () => {
    setSelectedUrls(savedUrls)
  }

  const handleClearSelection = () => {
    setSelectedUrls([])
  }

  const handleUseSelected = () => {
    if (selectedUrls.length === 0) {
      toast({
        title: "No URLs Selected",
        description: "Please select at least one URL to use",
        variant: "destructive",
      })
      return
    }

    if (selectedUrls.length === 1 && onUrlSelect) {
      onUrlSelect(selectedUrls[0])
    } else if (onMultipleUrlSelect) {
      onMultipleUrlSelect(selectedUrls)
    }

    toast({
      title: "URLs Added to Crawler",
      description: `${selectedUrls.length} URL(s) have been added to the Website Crawler`,
    })

    // Clear selection after use
    setSelectedUrls([])
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">
          Saved URLs{" "}
          {savedUrls.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {savedUrls.length}
            </Badge>
          )}
        </CardTitle>
        {!isAddingUrl ? (
          <Button size="sm" className="gap-1" onClick={() => setIsAddingUrl(true)}>
            <Plus className="h-4 w-4" />
            Add URL
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {/* Add URL Form */}
        {isAddingUrl && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-3">
              <div>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddUrl()
                    } else if (e.key === "Escape") {
                      handleCancelAdd()
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelAdd}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddUrl}>
                  <Check className="h-4 w-4 mr-1" />
                  Add URL
                </Button>
              </div>
            </div>
          </div>
        )}

        {savedUrls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No saved URLs yet.</p>
            <p className="text-sm">Add URLs to quickly access them for scraping.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All ({savedUrls.length})
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearSelection}>
                  Clear
                </Button>
              </div>
              {selectedUrls.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedUrls.length} selected</Badge>
                  <Button size="sm" onClick={handleUseSelected}>
                    Use Selected
                  </Button>
                </div>
              )}
            </div>

            {/* URL List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedUrls.map((url, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                    selectedUrls.includes(url) ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUrls.includes(url)}
                    onChange={() => handleUrlToggle(url)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{url}</p>
                    <p className="text-xs text-muted-foreground">{new URL(url).hostname}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(url)} title="Copy URL">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(url, "_blank")} title="Open URL">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUrl(url)}
                      title="Remove URL"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
