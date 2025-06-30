import json
import requests
from django.utils import timezone
from .models import ScheduledJob, UserSession
from django.utils.timezone import localtime


def run_scheduled_jobs_if_frontend_offline():
    now = localtime()  
    current_hour = now.hour
    current_minute = now.minute
    day = now.strftime('%A')

    scheduled_jobs = ScheduledJob.objects.filter(
        scheduled_hour=current_hour,
        scheduled_minute=current_minute
    )

    print(f"[INFO] Local time: {now} (Hour: {current_hour}, Minute: {current_minute}, Day: {day})")
    print(f"[INFO] Found {scheduled_jobs.count()} scheduled job(s).")

    for job in scheduled_jobs:
        if day not in job.repeat_days:
            continue

        if job.last_run and (now - job.last_run).seconds < 60:
            continue

        has_active_session = UserSession.objects.filter(
            job_id=str(job.id),
            status__in=['running', 'pending']
        ).exists()

        if has_active_session:
            print(f"[SKIP] Active session exists for job {job.id}")
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
