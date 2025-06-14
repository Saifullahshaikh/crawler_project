"use client"

import type React from "react"

import { useState } from "react"
import { PlusCircle, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useScrapingStore } from "@/lib/store"
import { scrapeUrls } from "@/app/actions/scrape"
import { scrapeUrlsPython } from "@/app/actions/python-scrape"
import { scrapeWithPythonApi } from "@/app/actions/python-api-scrape"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { ApiFileUpload } from "@/components/api-file-upload"

type ScrapeMethod = "js" | "python-route" | "python-api"

export function UrlForm() {
  const [urls, setUrls] = useState<string[]>([""])
  const [isLoading, setIsLoading] = useState(false)
  const [scrapeMethod, setScrapeMethod] = useState<ScrapeMethod>("js")
  const [pythonFilePath, setPythonFilePath] = useState<string>("scripts/scraper.py")
  const [apiPythonFilePath, setApiPythonFilePath] = useState<string>("uploads/default_scraper.py")
  const { toast } = useToast()
  const { addScrapedData } = useScrapingStore()

  const addUrlField = () => {
    setUrls([...urls, ""])
  }

  const removeUrlField = (index: number) => {
    const newUrls = [...urls]
    newUrls.splice(index, 1)
    setUrls(newUrls.length ? newUrls : [""])
  }

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleFileSelected = (filePath: string) => {
    setPythonFilePath(filePath)
  }

  const handleApiFileSelected = (filePath: string) => {
    setApiPythonFilePath(filePath)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty URLs
    const validUrls = urls.filter((url) => url.trim() !== "")

    if (validUrls.length === 0) {
      toast({
        title: "No URLs provided",
        description: "Please enter at least one valid URL",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      let scrapedResults

      // Use the selected scraping method
      switch (scrapeMethod) {
        case "python-route":
          scrapedResults = await scrapeUrlsPython(validUrls, pythonFilePath)
          break
        case "python-api":
          scrapedResults = await scrapeWithPythonApi(validUrls, apiPythonFilePath)
          break
        default:
          scrapedResults = await scrapeUrls(validUrls)
      }

      // Add scraped data to store
      addScrapedData(scrapedResults)

      toast({
        title: "Scraping completed",
        description: `Successfully scraped ${validUrls.length} URL(s) using ${
          scrapeMethod === "js" ? "JavaScript" : scrapeMethod === "python-route" ? "Python (Route)" : "Python API"
        }`,
      })
    } catch (error) {
      toast({
        title: "Scraping failed",
        description: error instanceof Error ? error.message : "There was an error scraping the URLs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  disabled={isLoading}
                />
                {urls.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeUrlField(index)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <Tabs
              value={scrapeMethod}
              onValueChange={(value) => setScrapeMethod(value as ScrapeMethod)}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
                <TabsTrigger value="python-route">Python (Route)</TabsTrigger>
                <TabsTrigger value="python-api">Python API</TabsTrigger>
              </TabsList>
            </Tabs>

            {scrapeMethod === "python-route" && <FileUpload onFileSelected={handleFileSelected} />}

            {scrapeMethod === "python-api" && <ApiFileUpload onFileSelected={handleApiFileSelected} />}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={addUrlField} disabled={isLoading} className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Add URL
              </Button>

              <Button type="submit" disabled={isLoading} className="ml-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  `Scrape URLs (${
                    scrapeMethod === "js"
                      ? "JavaScript"
                      : scrapeMethod === "python-route"
                        ? "Python Route"
                        : "Python API"
                  })`
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
