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
      try {
          // Retrieve CSRF token from cookies or meta tag
          const getCookie = (name: string) => {
              const value = `; ${document.cookie}`;
              const parts = value.split(`; ${name}=`);
              if (parts.length === 2) {
                  const part = parts.pop();
                  if (part !== undefined) {
                      return part.split(';').shift();
                  }
              }
              return null;
          };
          const csrfToken = getCookie('csrftoken') || (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;

          // Make API call to logout with CSRF token
          const response = await this.apiCall("/auth/logout/", {
              method: "POST",
              credentials: "include", // Include cookies in the request
              headers: {
                  'X-CSRFToken': csrfToken || '', // Include CSRF token in headers
                  'Content-Type': 'application/json'
              }
          });

          // Clear session storage
          sessionStorage.clear();

          // Clear local storage
          localStorage.clear();

          // Clear all cookies
          document.cookie.split(";").forEach(cookie => {
              const name = cookie.split("=")[0].trim();
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          });

          // Redirect to login page
          window.location.replace("/");

          return response;
      } catch (error) {
          console.error("Logout failed:", error);
          // Optionally notify user of failure
          throw error;
      }
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
