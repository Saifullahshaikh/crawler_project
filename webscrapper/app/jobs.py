import json
import requests
from django.utils import timezone
from .models import ScheduledJob, UserSession
from django.utils.timezone import localtime
from datetime import timedelta


def run_scheduled_jobs_if_frontend_offline():
    now = localtime()
    current_hour = now.hour
    current_minute = now.minute
    day = now.strftime('%A')

    print(f"[INFO] Local time: {now} (Hour: {current_hour}, Minute: {current_minute}, Day: {day})")

    # ⛔️ Global check: If any session is running/pending, skip execution of all jobs
    if UserSession.objects.filter(status__in=['running', 'pending']).exists():
        print("[BLOCKED] Another job is already running or pending. Skipping all scheduled jobs.")
        return

    # Check for the latest failed job due to network issues within last 10 minutes
    ten_minutes_ago = now - timedelta(minutes=10)
    failed_job = UserSession.objects.filter(
        status='failed',
        updated_at__gte=ten_minutes_ago,
        error__icontains='network'  # Using 'error' field from UserSession model
    ).order_by('-updated_at').first()

    if failed_job:
        try:
            print(f"[INFO] Found latest failed job {failed_job.job_id} due to network issue. Retrying...")
            failed_job.status = 'running'
            failed_job.progress = 0
            failed_job.error = None  # Clear previous error
            failed_job.updated_at = now
            failed_job.save()
            print(f"[OK] Job {failed_job.job_id} status changed to running")
        except Exception as e:
            print(f"[ERROR] Failed to retry job {failed_job.job_id}: {e}")

    scheduled_jobs = ScheduledJob.objects.filter(
        scheduled_hour=current_hour,
        scheduled_minute=current_minute
    )

    print(f"[INFO] Found {scheduled_jobs.count()} scheduled job(s).")

    for job in scheduled_jobs:
        if day not in job.repeat_days:
            continue

        if job.last_run and (now - job.last_run).seconds < 60:
            continue

        try:
            # Trigger crawl
            response = requests.post(
                "http://127.0.0.1:8000/api/crawl/",
                headers={"Content-Type": "application/json"},
                data=json.dumps({"urls": job.urls})
            )

            if response.status_code != 200:
                print(f"[ERROR] Failed to crawl: {response.text}")
            else:
                print(f"[OK] Crawl started: {response.json().get('jobId')}")

            UserSession.objects.create(
                job_id=str(response.json().get('jobId')),
                user=job.user,
                status='running',
                progress=0,
                urls=job.urls
            )

            job.last_run = now
            job.save()

        except Exception as e:
            print(f"[ERROR] Exception in job {job.id}: {e}")