// Django API endpoints
const DJANGO_API_BASE = process.env.DJANGO_API_URL || "http://localhost:8000/api"

export interface CrawlSessionData {
  id: string
  urls: string[]
  status: "pending" | "running" | "completed" | "failed"
  started_at: string
  completed_at?: string
  error?: string
  progress?: number
}

export interface CategoryLinkData {
  id: string
  url: string
  crawl_session_id: string
  created_at: string
}

export interface ProductData {
  id: string
  name?: string
  title: string
  price: string
  previous_price?: string
  new_price?: string
  rating?: string
  customer_reviews?: string
  product_url: string
  image_url?: string
  website_url: string
  crawl_session_id: string
  created_at: string
  thumbnail_images?: string[]
  size_options?: string[]
  specifications?: string[]
  price_range?: string[]
  meta_data?: Record<string, any>
}

export class DjangoApiService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${DJANGO_API_BASE}${endpoint}`

    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Crawl Session Methods
  static async createCrawlSession(urls: string[]): Promise<CrawlSessionData> {
    return this.makeRequest("/crawl-sessions/", {
      method: "POST",
      body: JSON.stringify({ urls }),
    })
  }

  static async updateCrawlSessionStatus(
    id: string,
    status: "pending" | "running" | "completed" | "failed",
    error?: string,
    progress?: number,
  ): Promise<CrawlSessionData> {
    return this.makeRequest(`/crawl-sessions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status, error, progress }),
    })
  }

  static async getCrawlSession(id: string): Promise<CrawlSessionData> {
    return this.makeRequest(`/crawl-sessions/${id}/`)
  }

  static async getLatestCrawlSessions(limit = 10): Promise<CrawlSessionData[]> {
    const response = await this.makeRequest(`/crawl-sessions/?limit=${limit}&ordering=-started_at`)
    return response.results || response
  }

  // Category Links Methods
  static async saveCategoryLinks(crawlSessionId: string, urls: string[]): Promise<void> {
    await this.makeRequest("/category-links/bulk/", {
      method: "POST",
      body: JSON.stringify({
        crawl_session_id: crawlSessionId,
        urls: urls,
      }),
    })
  }

  static async getCategoryLinks(crawlSessionId?: string): Promise<CategoryLinkData[]> {
    const endpoint = crawlSessionId
      ? `/category-links/?crawl_session_id=${crawlSessionId}`
      : "/category-links/?limit=100&ordering=-created_at"

    const response = await this.makeRequest(endpoint)
    return response.results || response
  }

  static async getLatestCategoryLinks(): Promise<CategoryLinkData[]> {
    const response = await this.makeRequest("/category-links/latest/")
    return response.results || response
  }

  // Product Methods
  static async saveProducts(crawlSessionId: string, products: any[]): Promise<void> {
    const productData = products.map((product) => ({
      name: product.name,
      title: product.product_details?.Title || product.name || "Unknown Product",
      price: product.price,
      previous_price: product.product_details?.["Previous Price"],
      new_price: product.product_details?.["New Price"],
      rating: product.product_details?.Rating,
      customer_reviews: product.product_details?.["Customer Reviews"],
      product_url: product.product_url,
      image_url: product.image_url,
      website_url: product.website_url || "",
      crawl_session_id: crawlSessionId,
      thumbnail_images: product.product_details?.["Thumbnail Images"] || [],
      size_options: product.product_details?.["Size Options"] || [],
      specifications: product.product_details?.["Product Specification"] || [],
      price_range: product.product_details?.["Price Range"] || [],
      meta_data: product.product_details || {},
    }))

    await this.makeRequest("/products/bulk/", {
      method: "POST",
      body: JSON.stringify({
        crawl_session_id: crawlSessionId,
        products: productData,
      }),
    })
  }

  static async getProducts(crawlSessionId?: string): Promise<ProductData[]> {
    const endpoint = crawlSessionId
      ? `/products/?crawl_session_id=${crawlSessionId}`
      : "/products/?limit=100&ordering=-created_at"

    const response = await this.makeRequest(endpoint)
    return response.results || response
  }

  static async getLatestProducts(): Promise<ProductData[]> {
    const response = await this.makeRequest("/products/latest/")
    return response.results || response
  }

  // Comparison Methods
  static async getProductChangesByJobId(jobId: string) {
    return this.makeRequest(`/product-changes?jobId=${jobId}`)
  }

  // Update the existing comparison method to use job ID if provided
  static async getProductComparison(jobId?: string) {
    if (jobId) {
      return this.getProductChangesByJobId(jobId)
    }
    return this.makeRequest("/products/comparison/")
  }

  // Search and Filter Methods
  static async searchProducts(query: string, filters?: Record<string, any>): Promise<ProductData[]> {
    const params = new URLSearchParams({ search: query })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const response = await this.makeRequest(`/products/search/?${params}`)
    return response.results || response
  }

  // Analytics Methods
  static async getAnalytics(crawlSessionId?: string) {
    const endpoint = crawlSessionId ? `/analytics/?crawl_session_id=${crawlSessionId}` : "/analytics/"

    return this.makeRequest(endpoint)
  }

  // Export Methods
  static async exportData(format: "json" | "csv" | "excel", crawlSessionId?: string): Promise<Blob> {
    const params = new URLSearchParams({ format })
    if (crawlSessionId) {
      params.append("crawl_session_id", crawlSessionId)
    }

    const response = await fetch(`${DJANGO_API_BASE}/export/?${params}`, {
      headers: {
        Accept:
          format === "json"
            ? "application/json"
            : format === "csv"
              ? "text/csv"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.blob()
  }

  // Cleanup Methods
  static async deleteOldCrawlSessions(daysOld = 30): Promise<{ deleted_count: number }> {
    return this.makeRequest("/crawl-sessions/cleanup/", {
      method: "POST",
      body: JSON.stringify({ days_old: daysOld }),
    })
  }

  static async deleteCrawlSession(id: string): Promise<void> {
    await this.makeRequest(`/crawl-sessions/${id}/`, {
      method: "DELETE",
    })
  }
}
