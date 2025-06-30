"use client"
import { useEffect, useState, useRef } from "react"
import { toast } from "@/components/ui/use-toast"
import djangoApiService from "@/lib/django-api-service"
import { useDjangoSession } from "@/hooks/use-django-session"


export function SchedulerManager({ userId }) {
  const { activeSession, isLoading, error, fetchSessions } = useDjangoSession()
  const [jobs, setJobs] = useState([])
  const jobsRef = useRef([])
  console.log("User ID from SchedulerManager:", userId)

  const fetchJobs = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/scheduler/scheduled-jobs/`)
    const data = await res.json()
    setJobs(data)
    jobsRef.current = data // store in ref to access in setInterval
    console.log("Fetched jobs ------> from SchedulerManager:", data)
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(() => {
      fetchJobs()
      checkAndTriggerJobs()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkAndTriggerJobs = async () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const today = now.toLocaleDateString("en-US", { weekday: "long" })

    for (const job of jobsRef.current) {
      const lastRun = job.last_run ? new Date(job.last_run) : null
      const jobHour = Number(job.scheduled_hour)
      const jobMinute = Number(job.scheduled_minute)
      const isTime = jobHour === hour && jobMinute === minute
      const shouldRunToday = !job.repeat_days || job.repeat_days.includes(today)
      const notRunToday = !lastRun || lastRun.toDateString() !== now.toDateString()

      console.log(`Checking job #${job.id} - Is time: ${isTime} - Should run: ${shouldRunToday} - Not run today: ${notRunToday}`)

      const response = await djangoApiService.getUserSessions(userId)
      console.log(`Active session for user ${userId}:`, response)

      if (isTime && shouldRunToday && notRunToday && response.active_session == null) {
        console.log(`🔁 Triggering job #${job.id}`)

        const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/crawl/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: job.urls })
          })

          const data = await response.json()
          if (!response.ok) throw new Error(data.error || "Crawl failed")

          const jobId = data.jobId

          await djangoApiService.createUserSession({
            job_id: jobId,
            user_id: job.user,
            urls: job.urls,
            status: "running",
          })
        // Refresh jobs after update
        await fetchJobs()

        toast({ title: "Scheduled job triggered", description: `Job #${job.id}` })
      }
    }
  }

  return null
}
