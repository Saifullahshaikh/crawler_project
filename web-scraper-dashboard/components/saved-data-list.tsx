"use client"

import { useState } from "react"
import { Download, ExternalLink, ChevronDown, ChevronUp, Trash2, FileJson } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { useScrapingStore } from "@/lib/store"
import { formatDistanceToNow } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export function SavedDataList() {
  const { savedData, removeSavedData } = useScrapingStore()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleDownload = (id: string, format: "json" | "csv" | "txt") => {
    const dataItem = savedData.find((item) => item.id === id)
    if (!dataItem) return

    // In a real app, this would format the data properly
    const data = JSON.stringify(dataItem.data, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `saved-data-${id}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: `Downloading data as ${format.toUpperCase()}`,
    })
  }

  if (!savedData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Data</CardTitle>
          <CardDescription>Your saved data will appear here</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No saved data yet
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Data</CardTitle>
        <CardDescription>Access and manage your saved scraped data</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {savedData.map((item) => (
              <Collapsible
                key={item.id}
                open={openItems[item.id]}
                onOpenChange={() => toggleItem(item.id)}
                className="border rounded-lg"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Saved {formatDistanceToNow(new Date(item.timestamp))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {item.data.length} URL{item.data.length > 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSavedData(item.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon">
                        {openItems[item.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0 border-t">
                    <div className="py-2">
                      <h3 className="font-medium mb-2">Scraped URLs:</h3>
                      <ul className="space-y-1">
                        {item.data.map((dataItem, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{dataItem.url}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item.id, "json")}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        JSON
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item.id, "csv")}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item.id, "txt")}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        TXT
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
