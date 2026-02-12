from django.core.management.base import BaseCommand
from app.jobs import run_scheduled_jobs_if_frontend_offline
import time

class Command(BaseCommand):
    help = 'Run scheduled jobs if frontend is offline'

    def handle(self, *args, **options):
        self.stdout.write("Scheduler started. Running every 30 seconds...\n")
        try:
            while True:
                run_scheduled_jobs_if_frontend_offline()
                time.sleep(10)
        except KeyboardInterrupt:
            self.stdout.write("Scheduler stopped.")
