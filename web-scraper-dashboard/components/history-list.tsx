"use client"

import { useState } from "react"
import { Clock, ExternalLink, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { useScrapingStore } from "@/lib/store"
import { formatDistanceToNow } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function HistoryList() {
  const { history, removeFromHistory } = useScrapingStore()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (!history.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scraping History</CardTitle>
          <CardDescription>Your scraping history will appear here</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No scraping history yet
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scraping History</CardTitle>
        <CardDescription>View your previous scraping activities</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {history.map((item) => (
              <Collapsible
                key={item.id}
                open={openItems[item.id]}
                onOpenChange={() => toggleItem(item.id)}
                className="border rounded-lg"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {item.urls.length} URL{item.urls.length > 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromHistory(item.id)
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
                        {item.urls.map((url, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{url}</span>
                          </li>
                        ))}
                      </ul>
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
