# views.py

import json
import os
import uuid
import threading
import time
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import render
from django.http import QueryDict
from .scrapper import ProductDataScraper
from .crawler import crawl_links_recursively
# from .crawler import crawl_website

from .models import ProductChangeLog
from .utils import save_crawled_data_to_db
import json

jobs = {}

# def run_crawler(job_id, urls):
#     job_dir = f"jobs/{job_id}"
#     os.makedirs(job_dir, exist_ok=True)

#     jobs[job_id]["status"] = "running"
    
#     all_category_links = []
#     all_product_data = []

#     for i, url in enumerate(urls):
#         category_output = f"{job_dir}/category_links_{i}.json"
#         product_output = f"{job_dir}/product_data_{i}.json"

#         crawl_links_recursively(url, category_output)

#         scraper = ProductDataScraper(category_output)
#         scraper.scrape_all_urls()
#         scraper.save_to_json(product_output)

#         with open(category_output, 'r') as f:
#             category_links = json.load(f)
#             all_category_links.extend(category_links)

#         with open(product_output, 'r') as f:
#             product_data = json.load(f)
#             all_product_data.extend(product_data)

#         jobs[job_id]["progress"] = int((i + 1) / len(urls) * 100)

#     with open(f"{job_dir}/all_category_links.json", 'w') as f:
#         json.dump(all_category_links, f, indent=2)

#     with open(f"{job_dir}/all_product_data.json", 'w') as f:
#         json.dump(all_product_data, f, indent=2)

    

#     save_crawled_data_to_db(job_id, urls, all_product_data)

#     jobs[job_id]["status"] = "completed"
#     jobs[job_id]["completedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
#     jobs[job_id]["results"] = {
#         "categoryLinks": all_category_links,
#         "productData": all_product_data
#     }


def run_crawler(job_id, urls):
    job_dir = f"jobs/{job_id}"
    os.makedirs(job_dir, exist_ok=True)

    jobs[job_id]["status"] = "running"
    all_category_links = []
    all_product_data = []

    for i, url in enumerate(urls):
        try:
            category_output = f"{job_dir}/category_links_{i}.json"
            product_output = f"{job_dir}/product_data_{i}.json"

            # Crawl category links
            crawl_links_recursively(url, category_output)

            # Load category links for this url
            with open(category_output, 'r') as f:
                category_links = json.load(f)
                all_category_links.extend(category_links)

            # Scrape product data
            scraper = ProductDataScraper(category_output)
            scraper.scrape_all_urls()

            # Save intermediate product data
            scraper.save_to_json(product_output)

            with open(product_output, 'r') as f:
                product_data = json.load(f)
                all_product_data.extend(product_data)

            # Persist data to DB immediately after scraping this URL
            save_crawled_data_to_db(job_id, [url], product_data)

            # Update progress
            jobs[job_id]["progress"] = int((i + 1) / len(urls) * 100)

        except Exception as e:
            # Log error but continue to next url
            print(f"Error processing URL {url}: {e}")

    # Save final aggregated files (optional but good)
    with open(f"{job_dir}/all_category_links.json", 'w') as f:
        json.dump(all_category_links, f, indent=2)

    with open(f"{job_dir}/all_product_data.json", 'w') as f:
        json.dump(all_product_data, f, indent=2)

    # Save entire dataset to DB again (optional full backup)
    # save_crawled_data_to_db(job_id, urls, all_product_data)

    jobs[job_id]["status"] = "completed"
    jobs[job_id]["completedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    jobs[job_id]["results"] = {
        "categoryLinks": all_category_links,
        "productData": all_product_data
    }

@csrf_exempt
@require_http_methods(["POST"])
def start_crawl(request):
    try:
        data = json.loads(request.body)
        urls = data.get("urls")
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not urls or not isinstance(urls, list) or len(urls) == 0:
        return JsonResponse({"error": "At least one URL is required"}, status=400)

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "id": job_id,
        "urls": urls,
        "status": "pending",
        "progress": 0,
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    thread = threading.Thread(target=run_crawler, args=(job_id, urls))
    thread.start()

    return JsonResponse({
        "status": "success",
        "message": f"Crawling started for {len(urls)} URL(s)",
        "jobId": job_id
    })

@require_http_methods(["GET"])
def get_job_status(request):
    job_id = request.GET.get("jobId")
    if not job_id or job_id not in jobs:
        return JsonResponse({"error": "Invalid job ID"}, status=400)

    job = jobs[job_id]
    return JsonResponse({
        "id": job["id"],
        "urls": job["urls"],
        "status": job["status"],
        "progress": job["progress"],
        "startedAt": job["startedAt"],
        "completedAt": job.get("completedAt"),
        "results": job.get("results", {})
    })

@require_http_methods(["GET"])
def get_categories(request):
    completed_jobs = [job for job in jobs.values() if job["status"] == "completed"]
    if not completed_jobs:
        return JsonResponse({"categoryLinks": []})
    latest_job = max(completed_jobs, key=lambda x: x["completedAt"])
    return JsonResponse({"categoryLinks": latest_job["results"]["categoryLinks"]})

@require_http_methods(["GET"])
def get_products(request):
    completed_jobs = [job for job in jobs.values() if job["status"] == "completed"]
    if not completed_jobs:
        return JsonResponse({"productData": []})
    latest_job = max(completed_jobs, key=lambda x: x["completedAt"])
    return JsonResponse({"productData": latest_job["results"]["productData"]})



@require_http_methods(["GET"])
def get_product_changes(request):
    job_id = request.GET.get("jobId")
    if not job_id:
        return JsonResponse({"error": "Job ID is required"}, status=400)

    logs = ProductChangeLog.objects.filter(crawl_job__job_id=job_id)
    data = {
        "new": [],
        "updated": [],
        "removed": []
    }

    for log in logs:
        data[log.change_type].append(log.data)

    return JsonResponse(data)
