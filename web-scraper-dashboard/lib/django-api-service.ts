"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api"

export interface User {
  id: string
  username: string
  email: string
}

export interface UserSession {
  id: string
  job_id: string
  user_id: string
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  message?: string
  error?: string
  urls: string[]
  started_at: string
  updated_at: string
  completed_at?: string
}

export interface CrawlSession {
  id: string
  job_id: string
  user_id: string
  urls: string[]
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  results?: any
  error?: string
  created_at: string
  updated_at: string
}

class DjangoApiService {
  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for session cookies
      ...options,
    }

    const response = await fetch(url, defaultOptions)

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Authentication
  async login(username: string, password: string) {
    return this.apiCall("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  }

  async logout() {
    return this.apiCall("/auth/logout/", {
      method: "POST",
    })
  }

  async getProfile() {
    return this.apiCall("/auth/profile/")
  }

  async getSessionStatus() {
    return this.apiCall("/auth/session-status/", {
      method: "GET",
      credentials: "include",
    });
  }

  async healthCheck() {
    return this.apiCall("/health/")
  }

  // User Sessions
  async getUserSessions(userId: string): Promise<{ active_session: UserSession | null; all_sessions: UserSession[] }> {
    return this.apiCall(`/user-sessions/?user_id=${userId}`)
  }

  async createUserSession(data: {
    job_id: string
    user_id: string
    urls: string[]
    status?: string
  }): Promise<UserSession> {
    return this.apiCall("/user-sessions/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }


  async updateUserSession(jobId: string, updates: any): Promise<UserSession> {
    console.log("Updating user session:", jobId, "with updates:", updates);

    return this.apiCall(`/user-sessions/${jobId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // still required if you're using session-based auth
      body: JSON.stringify(updates),
    });
  }
  async deleteUserSession(jobId: string): Promise<{ success: boolean }> {
    return this.apiCall(`/user-sessions/${jobId}/`, {
      method: "DELETE",
    })
  }

  // Crawl Sessions
  async getLatestCrawlSessions(userId: string, limit = 10): Promise<CrawlSession[]> {
    const response = await this.apiCall(`/crawl-sessions/?user_id=${userId}&limit=${limit}`)
    return response.results
  }

  async createCrawlSession(urls: string[], userId: string): Promise<CrawlSession> {
    const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return this.apiCall("/crawl-sessions/", {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        user_id: userId,
        urls,
        status: "pending",
      }),
    })
  }

  async updateCrawlSessionStatus(sessionId: string, status: string, error?: string): Promise<CrawlSession> {
    return this.apiCall(`/crawl-sessions/${sessionId}/`, {
      method: "PATCH",
      body: JSON.stringify({ status, error }),
    })
  }

  async deleteCrawlSession(sessionId: string): Promise<{ success: boolean }> {
    return this.apiCall(`/crawl-sessions/${sessionId}/`, {
      method: "DELETE",
    })
  }
}

export const djangoApiService = new DjangoApiService()
export { DjangoApiService }
export default djangoApiService



function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()!.split(";").shift()!;
  }
  return null;
}
