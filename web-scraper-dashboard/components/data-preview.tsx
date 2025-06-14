"use client"

import { useState } from "react"
import { Download, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useScrapingStore } from "@/lib/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function DataPreview() {
  const { toast } = useToast()
  const { currentData, saveData } = useScrapingStore()
  const [activeTab, setActiveTab] = useState("preview")

  if (!currentData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>Enter URLs above and click "Scrape URLs" to see the data here</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No data to preview yet
        </CardContent>
      </Card>
    )
  }

  const handleSave = () => {
    saveData()
    toast({
      title: "Data saved",
      description: `Saved data from ${currentData.length} URL(s)`,
    })
  }

  const handleDownload = (format: "json" | "csv" | "txt") => {
    // In a real app, this would format the data properly
    const data = JSON.stringify(currentData, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `scraped-data.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: `Downloading data as ${format.toUpperCase()}`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Data Preview</span>
          <Badge variant="outline" className="ml-2">
            {currentData.length} URL{currentData.length > 1 ? "s" : ""}
          </Badge>
        </CardTitle>
        <CardDescription>Preview the scraped data and save or export it</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="structured">Structured</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] rounded-md border p-4">
            <TabsContent value="preview" className="m-0">
              {currentData.map((item, index) => (
                <div key={index} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold mb-2">{item.url}</h3>
                  <div className="grid gap-2">
                    <div>
                      <span className="font-medium">Title:</span> {item.title}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {item.description}
                    </div>
                    <div>
                      <span className="font-medium">Headings:</span> {item.data.headings.join(", ")}
                    </div>
                    <div>
                      <span className="font-medium">Links:</span> {item.data.links.join(", ")}
                    </div>
                    <div>
                      <span className="font-medium">Images:</span> {item.data.images.length}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="json" className="m-0">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(currentData, null, 2)}</pre>
            </TabsContent>

            <TabsContent value="structured" className="m-0">
              <div className="space-y-6">
                {currentData.map((item, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-2">{item.url}</h3>

                    <div className="grid gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Headings</h4>
                        {item.data.headings && item.data.headings.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {item.data.headings.map((heading, i) => (
                              <li key={i}>{heading}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">No headings found</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium mb-1">Links</h4>
                        {item.data.links && item.data.links.length > 0 ? (
                          <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                            {item.data.links.map((link, i) => (
                              <li key={i} className="truncate">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  {link}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">No links found</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium mb-1">Images</h4>
                        {item.data.images && item.data.images.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {item.data.images.map((image, i) => (
                              <img
                                key={i}
                                src={image || "/placeholder.svg"}
                                alt={`Image ${i + 1}`}
                                className="rounded-md border h-24 object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=100&width=200"
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No images found</p>
                        )}
                      </div>

                      {item.data.text && (
                        <div>
                          <h4 className="font-medium mb-1">Text Preview</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">{item.data.text}</p>
                        </div>
                      )}

                      {item.data.metaTags && Object.keys(item.data.metaTags).length > 0 && (
                        <div>
                          <h4 className="font-medium mb-1">Meta Tags</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(item.data.metaTags)
                              .slice(0, 6)
                              .map(([key, value], i) => (
                                <div key={i} className="border rounded p-2">
                                  <span className="font-medium">{key}:</span> {value.substring(0, 50)}
                                  {value.length > 50 ? "..." : ""}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleDownload("json")} className="gap-1">
            <Download className="h-4 w-4" />
            JSON
          </Button>
          <Button variant="outline" onClick={() => handleDownload("csv")} className="gap-1">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleDownload("txt")} className="gap-1">
            <Download className="h-4 w-4" />
            TXT
          </Button>
        </div>
        <Button onClick={handleSave} className="gap-1">
          <Save className="h-4 w-4" />
          Save Data
        </Button>
      </CardFooter>
    </Card>
  )
}
