"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Settings, Database, History, Bookmark, BarChart3 } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { SessionSync } from "./session-sync"
import { CrawlerWithUrlManager } from "./crawler-with-url-manager"
import { HistoryList } from "./history-list"
import { SavedDataList } from "./saved-data-list"
import { DatabaseManager } from "./database-manager"
import { ProductComparison } from "./product-comparison"
import { SchedulerTab } from "./SchedulerTab"




export function DashboardShell() {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState("crawler")

  const handleLogout = async () => {
    await logout()
  }

  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [completedJobId, setCompletedJobId] = useState<string>("")

  // Function to trigger refresh of category links and product data
  const handleScrapeComplete = useCallback((jobId?: string) => {
    setRefreshTrigger((prev) => prev + 1)
    if (jobId) {
      setCompletedJobId(jobId)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Web Scraper Dashboard</h1>
              <Badge variant="secondary">v2.0</Badge>
            </div>

            <div className="flex items-center space-x-4">
              {/* Session Sync Component */}
              <SessionSync />

              {/* User Info */}
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.username}</span>
              </div>

              {/* Logout Button */}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="crawler" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Crawler</span>
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Scheduler</span>
            </TabsTrigger>
            {/* <TabsTrigger value="saved" className="flex items-center space-x-2">
              <Bookmark className="h-4 w-4" />
              <span>Saved Data</span>
            </TabsTrigger> */}
            {/* <TabsTrigger value="database" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Database</span>
            </TabsTrigger> */}
            <TabsTrigger value="comparison" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Comparison</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Sessions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crawler" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Web Crawler</CardTitle>
                <CardDescription>Configure and run web scraping sessions with URL management</CardDescription>
              </CardHeader>
              <CardContent>
                <CrawlerWithUrlManager onScrapeComplete={handleScrapeComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crawling History</CardTitle>
                <CardDescription>View your previous crawling sessions and results</CardDescription>
              </CardHeader>
              <CardContent>
                <HistoryList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduler">
            <Card>
              <CardHeader>
                <CardTitle>Crawk Scheduler</CardTitle>
                <CardDescription>View your previous crawling sessions and results</CardDescription>
              </CardHeader>
              <CardContent>
                <SchedulerTab userId={user?.id ?? ""}/>
              </CardContent>
            </Card>
            
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Data</CardTitle>
                <CardDescription>Manage your saved crawling results and exports</CardDescription>
              </CardHeader>
              <CardContent>
                <SavedDataList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Manage your crawling database and perform maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <DatabaseManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Comparison</CardTitle>
                <CardDescription>Compare products and analyze changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductComparison refreshTrigger={refreshTrigger} completedJobId={completedJobId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>View and manage your active and completed sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <SessionSync />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
