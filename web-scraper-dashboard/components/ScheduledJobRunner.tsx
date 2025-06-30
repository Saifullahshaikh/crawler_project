"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/auth-store"

interface ScheduledJob {
  id: string
  urls: string[]
  scheduled_time: string
  repeat_after_days: number
  last_run: string | null
}

interface Props {
  onScrapeComplete?: (jobId?: string) => void
}

export function ScheduledJobRunner({ onScrapeComplete }: Props) {
  const { user } = useAuthStore()
  const [jobs, setJobs] = useState<ScheduledJob[]>([])

  // fetch jobs from backend
  const fetchJobs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/scheduler/scheduled-jobs/`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setJobs(data)
      }
    } catch (err) {
      console.error("❌ Failed to fetch scheduled jobs", err)
    }
  }

  useEffect(() => {
    fetchJobs()

    const interval = setInterval(() => {
      const now = new Date()

      jobs.forEach((job) => {
        const scheduledTime = new Date(job.scheduled_time)
        const lastRun = job.last_run ? new Date(job.last_run) : null

        const shouldRunOnce = !lastRun && scheduledTime <= now
        const shouldRepeat =
          job.repeat_after_days > 0 &&
          lastRun &&
          new Date(lastRun.getTime() + job.repeat_after_days * 86400000) <= now

        if (shouldRunOnce || shouldRepeat) {
          triggerCrawl(job)
        }
      })
    }, 30000) // every 30 seconds

    return () => clearInterval(interval)
  }, [jobs])

  const triggerCrawl = async (job: ScheduledJob) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/crawl/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: job.urls }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      console.log("✅ Job triggered:", job.id)
      onScrapeComplete?.(data.jobId)

      // update last_run
      await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/scheduler/scheduled-jobs/${job.id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ last_run: new Date().toISOString() }),
      })

      // refresh jobs
      fetchJobs()
    } catch (error) {
      console.error("❌ Failed to trigger job:", job.id, error)
    }
  }

  return null // this runs silently in background
}
