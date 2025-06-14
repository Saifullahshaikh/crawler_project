import { DashboardShell } from "@/components/dashboard-shell"
import { DatabaseManager } from "@/components/database-manager"

export default function DatabasePage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
          <p className="text-muted-foreground mt-2">Manage crawl sessions, export data, and cleanup old records</p>
        </div>
        <DatabaseManager />
      </div>
    </DashboardShell>
  )
}
