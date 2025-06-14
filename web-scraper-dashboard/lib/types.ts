export interface CategoryLink {
  url: string
}

export interface Product {
  title: string
  price: string
  description: string
  url: string
  image?: string
  [key: string]: any // For any additional fields
}

export interface CrawlJob {
  id: string
  url: string
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  startedAt: string
  completedAt?: string
  error?: string
}

export interface CrawlResult {
  categoryLinks: string[]
  productData: Product[]
}
