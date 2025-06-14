import { DashboardShell } from "@/components/dashboard-shell"
import { SavedDataList } from "@/components/saved-data-list"

export default function SavedPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Data</h1>
          <p className="text-muted-foreground mt-2">Access and manage your saved scraped data</p>
        </div>
        <SavedDataList />
      </div>
    </DashboardShell>
  )
}
