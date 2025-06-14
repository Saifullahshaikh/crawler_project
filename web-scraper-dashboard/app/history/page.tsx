import { DashboardShell } from "@/components/dashboard-shell"
import { HistoryList } from "@/components/history-list"

export default function HistoryPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scraping History</h1>
          <p className="text-muted-foreground mt-2">View your previous scraping activities and saved data</p>
        </div>
        <HistoryList />
      </div>
    </DashboardShell>
  )
}
