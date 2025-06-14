import { ProductComparisonSampleView } from "@/components/product-comparison-sample-view"
import { DashboardShell } from "@/components/dashboard-shell"

export default function SampleViewPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Comparison - Sample View</h1>
          <p className="text-muted-foreground mt-2">
            Preview of the updated comparison component using your actual data structure
          </p>
        </div>
        <ProductComparisonSampleView />
      </div>
    </DashboardShell>
  )
}
