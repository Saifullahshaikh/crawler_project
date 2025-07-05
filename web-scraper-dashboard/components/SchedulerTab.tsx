"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useUIStore } from "@/lib/ui-store"
import { useDjangoSession } from "@/hooks/use-django-session"

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

type Job = {
  id: string;
  urls: string[];
  scheduled_hour: number;
  scheduled_minute: number;
  repeat_days: string[];
}

export function SchedulerTab({ userId }: { userId: string }) {
  const [scheduledHour, setScheduledHour] = useState("")
  const [scheduledMinute, setScheduledMinute] = useState("")
  const [urls, setUrls] = useState<string[]>([""])
  const [repeatDays, setRepeatDays] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const { showManualButton, setShowManualButton } = useUIStore()
  const { fetchSessions } = useDjangoSession()

  const fetchJobs = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/scheduler/scheduled-jobs/`)
    const data = await res.json()
    setJobs(data)
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSave = async () => {
    const payload = {
      urls,
      scheduled_hour: parseInt(scheduledHour),
      scheduled_minute: parseInt(scheduledMinute),
      repeat_days: repeatDays,
      user: userId,
    }

    const method = editingId ? "PUT" : "POST"
    const url = editingId
      ? `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/scheduler/scheduled-jobs/${editingId}/`
      : `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/scheduler/scheduled-jobs/`

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setEditingId(null)
      setUrls([""])
      setScheduledHour("")
      setScheduledMinute("")
      setRepeatDays([])
      setFileError(null)
      fetchJobs()
    }
  }

  const handleEdit = (job: Job) => {
    setEditingId(job.id)
    setUrls(job.urls)
    setScheduledHour(job.scheduled_hour.toString())
    setScheduledMinute(job.scheduled_minute.toString())
    setRepeatDays(job.repeat_days)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this job?")
    if (!confirmed) return

    const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/scheduler/scheduled-jobs/${id}/`, {
      method: "DELETE",
    })

    if (res.ok) {
      toast({ title: "Job deleted", description: "The scheduled job has been removed." })
      fetchJobs()
    } else {
      toast({ title: "Error deleting job", description: "Please try again.", variant: "destructive" })
    }
  }

  const toggleDay = (day: string, checked: boolean) => {
    if (checked) setRepeatDays([...repeatDays, day])
    else setRepeatDays(repeatDays.filter(d => d !== day))
  }

  const handleUrlDelete = (index: number) => {
    const updated = [...urls]
    updated.splice(index, 1)
    setUrls(updated.length ? updated : [""])
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      try {
        const content = reader.result as string
        let importedUrls: string[] = []

        if (file.name.endsWith(".json")) {
          const json = JSON.parse(content)
          importedUrls = Array.isArray(json)
            ? json
            : Object.values(json).filter(v => typeof v === "string")
        } else {
          importedUrls = content
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
        }

        if (importedUrls.length === 0) {
          throw new Error("No URLs found in file.")
        }

        setUrls(prev => [...prev, ...importedUrls])
        toast({ title: "URLs imported", description: `${importedUrls.length} URL(s) added.` })
      } catch (err) {
        console.error(err)
        setFileError("Invalid file format or content. Must be a .txt, .csv, or .json file with URLs.")
        toast({
          title: "Invalid file",
          description: "Could not parse the file. Please check format and try again.",
          variant: "destructive",
        })
      }
    }

    reader.onerror = () => {
      setFileError("Error reading the file. Please try again.")
      toast({
        title: "File read error",
        description: "Something went wrong while reading the file.",
        variant: "destructive",
      })
    }

    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{editingId ? "Edit Schedule" : "Add Schedule"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">

          {/* URL Inputs */}
          <div className="space-y-2">
            {urls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={url} onChange={e => {
                  const updated = [...urls]
                  updated[index] = e.target.value
                  setUrls(updated)
                }} />
                <Button size="icon" variant="destructive" onClick={() => handleUrlDelete(index)}>🗑️</Button>
              </div>
            ))}
            <Button variant="outline" onClick={() => setUrls([...urls, ""])}>Add URL</Button>
            <Input type="file" accept=".txt,.csv,.json" onChange={handleFileUpload} className="mt-2" />
            {fileError && <p className="text-sm text-red-600 mt-1">{fileError}</p>}
          </div>

          {/* Time & Repeat Days */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hour</Label>
              <select className="w-full border p-2 rounded" value={scheduledHour} onChange={e => setScheduledHour(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Minute</Label>
              <select className="w-full border p-2 rounded" value={scheduledMinute} onChange={e => setScheduledMinute(e.target.value)}>
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Repeat Days</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {allDays.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox checked={repeatDays.includes(day)} onCheckedChange={(checked) => toggleDay(day, !!checked)} />
                  <Label>{day}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={showManualButton} onCheckedChange={checked => setShowManualButton(!!checked)} />
            <Label>Enable Manual Start</Label>
          </div>

          <Button onClick={handleSave}>{editingId ? "Update" : "Save"}</Button>
        </CardContent>
      </Card>

      {/* Job List */}
      <div>
        <h3 className="text-lg font-semibold">Scheduled Jobs</h3>
        <ul className="space-y-2 mt-4">
          {jobs.map(job => (
            <li key={job.id} className="flex justify-between items-start p-3 border rounded">
              <div className="text-sm space-y-1">
                <div>⏰ <strong>Time:</strong> {String(job.scheduled_hour).padStart(2, '0')}:{String(job.scheduled_minute).padStart(2, '0')}</div>
                <div>🔁 <strong>Repeats:</strong> {job.repeat_days.join(", ")}</div>
                <div>🔗 <strong>URLs:</strong> {job.urls.join(", ")}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(job)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(job.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
