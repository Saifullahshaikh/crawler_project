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
from django.core.exceptions import ObjectDoesNotExist
from .models import ProductChangeLog
import json
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
from .models import Product
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from django.db.models import Q


jobs = {}


# def run_crawler(job_id, urls):
#     job_dir = f"jobs/{job_id}"
#     os.makedirs(job_dir, exist_ok=True)

#     jobs[job_id]["status"] = "running"
#     all_category_links = []
#     all_product_data = []


#     for i, url in enumerate(urls):
#         try:
#             category_output = f"{job_dir}/category_links_{i}.json"
#             product_output = f"{job_dir}/product_data_{i}.json"

#             # Crawl category links
#             crawl_links_recursively(url, category_output, job_id=job_id)

#             # Load category links for this url
#             with open(category_output, 'r') as f:
#                 category_links = json.load(f)
#                 all_category_links.extend(category_links)

#             # # Scrape product data
#             # scraper = ProductDataScraper(category_output)
#             # scraper.scrape_all_urls()

#             # # Save intermediate product data
#             # scraper.save_to_json(product_output)

#             with open(product_output, 'r') as f:
#                 product_data = json.load(f)
#                 all_product_data.extend(product_data)

#             # Persist data to DB immediately after scraping this URL
#             # save_crawled_data_to_db(job_id, [url], product_data)

#             # Update progress
#             jobs[job_id]["progress"] = int((i + 1) / len(urls) * 100)

#         except Exception as e:
#             # Log error but continue to next url
#             print(f"Error processing URL {url}: {e}")

#     # Save final aggregated files (optional but good)
#     with open(f"{job_dir}/all_category_links.json", 'w') as f:
#         json.dump(all_category_links, f, indent=2)

#     with open(f"{job_dir}/all_product_data.json", 'w') as f:
#         json.dump(all_product_data, f, indent=2)

#     # Save entire dataset to DB again (optional full backup)
#     # save_crawled_data_to_db(job_id, urls, all_product_data)

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
            crawl_links_recursively(url, category_output, job_id=job_id)

            with open(category_output, 'r') as f:
                category_links = json.load(f)
                all_category_links.extend(category_links)

            # Uncomment when ready to scrape product data
            # scraper = ProductDataScraper(category_output)
            # scraper.scrape_all_urls()
            # scraper.save_to_json(product_output)

            # Update progress and persist to file
            progress = int((i + 1) / len(urls) * 100)
            jobs[job_id]["progress"] = progress
            update_job_file(job_id)

            # Update progress in UserSession if exists
            try:
                user_session = UserSession.objects.get(job_id=job_id)
                user_session.progress = progress
                user_session.save(update_fields=["progress"])
            except UserSession.DoesNotExist:
                pass

        except Exception as e:
            print(f"Error processing URL {url}: {e}")
            continue  # Continue with next URL

    # Save aggregated output
    with open(f"{job_dir}/all_category_links.json", 'w') as f:
        json.dump(all_category_links, f, indent=2)

    with open(f"{job_dir}/all_product_data.json", 'w') as f:
        json.dump(all_product_data, f, indent=2)

    # Finalize job status
    jobs[job_id]["status"] = "completed"
    jobs[job_id]["progress"] = 100  # Ensure progress is 100% on completion
    jobs[job_id]["completedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    jobs[job_id]["results"] = {
        "categoryLinks": all_category_links,
        "productData": all_product_data
    }
    update_job_file(job_id)


# @csrf_exempt
# @require_http_methods(["POST"])
# def start_crawl(request):
#     try:
#         data = json.loads(request.body)
#         urls = data.get("urls")
#     except Exception:
#         return JsonResponse({"error": "Invalid JSON"}, status=400)

#     if not urls or not isinstance(urls, list) or len(urls) == 0:
#         return JsonResponse({"error": "At least one URL is required"}, status=400)

#     job_id = str(uuid.uuid4())
#     jobs[job_id] = {
#         "id": job_id,
#         "urls": urls,
#         "status": "pending",
#         "progress": 0,
#         "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
#     }

#     thread = threading.Thread(target=run_crawler, args=(job_id, urls))
#     thread.start()

#     return JsonResponse({
#         "status": "success",
#         "message": f"Crawling started for {len(urls)} URL(s)",
#         "jobId": job_id
#     })

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
    job_data = {
        "id": job_id,
        "urls": urls,
        "status": "failed",  # Default to failed
        "progress": 0,
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    os.makedirs("jobs", exist_ok=True)
    with open(f"jobs/{job_id}_meta.json", "w") as f:
        json.dump(job_data, f, indent=2)

    jobs[job_id] = job_data

    # Start the crawling thread
    thread = threading.Thread(target=run_crawler, args=(job_id, urls))
    thread.start()

    return JsonResponse({
        "status": "success",
        "message": f"Crawling started for {len(urls)} URL(s)",
        "jobId": job_id
    })

def update_job_file(job_id):
    job_meta_path = f"jobs/{job_id}_meta.json"
    with open(job_meta_path, 'w') as f:
        json.dump(jobs[job_id], f, indent=2)



@require_http_methods(["GET"])
def get_job_status(request):
    job_id = request.GET.get("jobId")
    if not job_id:
        return JsonResponse({"error": "Missing job ID"}, status=400)

    if job_id not in jobs:
        # Try to load from disk
        job_meta_path = f"jobs/{job_id}_meta.json"
        if os.path.exists(job_meta_path):
            with open(job_meta_path, "r") as f:
                jobs[job_id] = json.load(f)
        else:
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


# @require_http_methods(["GET"])
# def get_job_status(request):
#     job_id = request.GET.get("jobId")

#     if not job_id:
#         return JsonResponse({"error": "Missing job ID"}, status=400)

#     # Try to fetch from database
#     try:
#         session = UserSession.objects.get(job_id=job_id)
#     except ObjectDoesNotExist:
#         return JsonResponse({"error": "Invalid job ID"}, status=404)

#     # Optional: fallback to jobs dict if used for temp memory progress tracking
#     job = jobs.get(job_id)

#     return JsonResponse({
#         "id": str(session.id),
#         "urls": session.urls,
#         "status": session.status,
#         "progress": session.progress,
#         "startedAt": session.started_at,
#         "completedAt": session.completed_at,
#         "message": session.message,
#         "error": session.error,
#         "results": job.get("results") if job else {}  # optional fallback
#     })

# @require_http_methods(["GET"])
# def get_job_status(request):
#     job_id = request.GET.get("jobId")

#     if not job_id:
#         return JsonResponse({"error": "Missing job ID"}, status=400)

#     try:
#         session = UserSession.objects.get(job_id=job_id)
#     except ObjectDoesNotExist:
#         return JsonResponse({"error": "Invalid job ID"}, status=404)

#     job = jobs.get(job_id)

#     # If job exists in memory, it's likely still running
#     if job:
#         status = job["status"]
#         progress = job["progress"]
#         results = job.get("results", {})
#         message = job.get("message")
#     else:
#         # Fallback to DB if job not in memory (restored, failed, or completed)
#         status = session.status
#         progress = session.progress
#         results = {}
#         message = session.message

#     return JsonResponse({
#         "id": str(session.id),
#         "urls": session.urls,
#         "status": status,
#         "progress": progress,
#         "startedAt": session.started_at.isoformat(),
#         "completedAt": session.completed_at.isoformat() if session.completed_at else None,
#         "message": message,
#         "error": session.error,
#         "results": results
#     })

@require_http_methods(["GET"])
def get_categories(request):
    completed_jobs = [job for job in jobs.values() if job["status"] == "completed"]
    if not completed_jobs:
        return JsonResponse({"categoryLinks": []})
    latest_job = max(completed_jobs, key=lambda x: x["completedAt"])
    return JsonResponse({"categoryLinks": latest_job["results"]["categoryLinks"]})

# @require_http_methods(["GET"])
# def get_products(request):
#     print(jobs)
#     completed_jobs = [job for job in jobs.values() if job["status"] == "running"]
#     if not completed_jobs:
#         return JsonResponse({"productData": []})
#     latest_job = max(completed_jobs, key=lambda x: x["completedAt"])
#     return JsonResponse({"productData": latest_job["results"]["productData"]})


# @require_http_methods(["GET"])
# def get_products(request):
#     products = Product.objects.select_related('category', 'crawl_job').all()
    
#     product_data = []
#     for product in products:
#         product_data.append({
#             "name": product.name,
#             "price": product.price,
#             "product_url": product.product_url,
#             "image_url": product.image_url,
#             "details": product.details,
#             "category_url": product.category.url if product.category else None,
#             "crawl_job_id": product.crawl_job.job_id if product.crawl_job else None,
#             "change_date": product.change_date.isoformat(),
#         })

#     return JsonResponse({"productData": product_data})


# @require_http_methods(["GET"])
# def get_products(request):
#     page = request.GET.get('page', 1)
#     per_page = request.GET.get('per_page', 20)

#     try:
#         per_page = int(per_page)
#         page = int(page)
#     except ValueError:
#         return JsonResponse({'error': 'Invalid page or per_page parameter'}, status=400)

#     products = Product.objects.select_related('category', 'crawl_job').all()
#     paginator = Paginator(products, per_page)

#     try:
#         products_page = paginator.page(page)
#     except PageNotAnInteger:
#         products_page = paginator.page(1)
#     except EmptyPage:
#         return JsonResponse({"productData": [], "message": "No more products"}, status=200)

#     product_data = []
#     for product in products_page:
#         product_data.append({
#             "name": product.name,
#             "price": product.price,
#             "product_url": product.product_url,
#             "image_url": product.image_url,
#             "details": product.details,
#             "category_url": product.category.url if product.category else None,
#             "crawl_job_id": product.crawl_job.job_id if product.crawl_job else None,
#             "change_date": product.change_date.isoformat(),
#         })

#     return JsonResponse({
#         "productData": product_data,
#         "total": paginator.count,
#         "num_pages": paginator.num_pages,
#         "current_page": products_page.number,
#         "has_next": products_page.has_next(),
#         "has_previous": products_page.has_previous(),
#     })





@require_http_methods(["GET"])
def get_products(request):
    page = request.GET.get('page', 1)
    per_page = request.GET.get('per_page', 20)
    search = request.GET.get('search', '')
    min_rating = request.GET.get('min_rating', None)
    sort_by = request.GET.get('sort_by', 'name')  # Default to sorting by name
    sort_order = request.GET.get('sort_order', 'asc')  # Default to ascending

    try:
        per_page = int(per_page)
        page = int(page)
    except ValueError:
        return JsonResponse({'error': 'Invalid page or per_page parameter'}, status=400)

    # Base queryset
    products = Product.objects.select_related('category', 'crawl_job').all()

    # Search across name, price, and details
    if search:
        products = products.filter(
            Q(name__icontains=search) |
            Q(price__icontains=search) |
            Q(details__icontains=search)
        )

    # Filter by minimum rating
    if min_rating and min_rating != 'all':
        try:
            min_rating_float = float(min_rating)
            products = products.filter(details__Rating__gte=min_rating_float)
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Invalid min_rating parameter'}, status=400)

    # Sorting
    if sort_by in ['name', 'price', 'rating']:
        if sort_by == 'rating':
            sort_field = 'details__Rating'
        else:
            sort_field = sort_by
        order = f'-{sort_field}' if sort_order == 'desc' else sort_field
        products = products.order_by(order)
    else:
        return JsonResponse({'error': 'Invalid sort_by parameter'}, status=400)

    # Pagination
    paginator = Paginator(products, per_page)
    try:
        products_page = paginator.page(page)
    except PageNotAnInteger:
        products_page = paginator.page(1)
    except EmptyPage:
        return JsonResponse({"productData": [], "message": "No more products"}, status=200)

    # Prepare response data
    product_data = []
    for product in products_page:
        product_data.append({
            "name": product.name,
            "price": product.price,
            "product_url": product.product_url,
            "image_url": product.image_url,
            "details": product.details,
            "category_url": product.category.url if product.category else None,
            "crawl_job_id": product.crawl_job.job_id if product.crawl_job else None,
            "change_date": product.change_date.isoformat(),
        })

    return JsonResponse({
        "productData": product_data,
        "total": paginator.count,
        "num_pages": paginator.num_pages,
        "current_page": products_page.number,
        "has_next": products_page.has_next(),
        "has_previous": products_page.has_previous(),
    })


# @require_http_methods(["GET"])
# def get_product_changes(request):
#     job_id = request.GET.get("jobId")
#     if not job_id:
#         return JsonResponse({"error": "Job ID is required"}, status=400)

#     logs = ProductChangeLog.objects.filter(crawl_job__job_id=job_id)
#     data = {
#         "new": [],
#         "updated": [],
#         "removed": []
#     }

#     for log in logs:
#         data[log.change_type].append(log.data)

#     return JsonResponse(data)



@require_http_methods(["GET"])
def get_product_changes(request):
    job_id = request.GET.get("jobId")
    page = request.GET.get("page", 1)
    per_page = request.GET.get("per_page", 20)

    if not job_id:
        return JsonResponse({"error": "Job ID is required"}, status=400)

    try:
        page = int(page)
        per_page = int(per_page)
    except ValueError:
        return JsonResponse({'error': 'Invalid page or per_page parameter'}, status=400)

    logs = ProductChangeLog.objects.filter(crawl_job__job_id=job_id).order_by('id')

    paginator = Paginator(logs, per_page)
    try:
        logs_page = paginator.page(page)
    except PageNotAnInteger:
        logs_page = paginator.page(1)
    except EmptyPage:
        return JsonResponse({
            "new": [], "updated": [], "removed": [],
            "pagination": {
                "total": paginator.count,
                "num_pages": paginator.num_pages,
                "current_page": page,
                "has_next": False,
                "has_previous": True,
            }
        })

    data = {
        "new": [],
        "updated": [],
        "removed": []
    }

    for log in logs_page:
        if log.change_type in data:
            data[log.change_type].append(log.data)

    data["pagination"] = {
        "total": paginator.count,
        "num_pages": paginator.num_pages,
        "current_page": logs_page.number,
        "has_next": logs_page.has_next(),
        "has_previous": logs_page.has_previous(),
    }

    return JsonResponse(data)




from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from .models import UserSession, CrawlSession, SavedUrl
import json
from django.utils import timezone





@csrf_exempt
@api_view(['POST'])
def login_view(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return Response({
                'success': False,
                'message': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return Response({
                'success': True,
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            return Response({
                'success': False,
                'message': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except json.JSONDecodeError:
        return Response({
            'success': False,
            'message': 'Invalid JSON'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'success': True})

@api_view(['GET'])
def profile_view(request):
    if request.user.is_authenticated:
        return Response({
            'user': {
                'id': str(request.user.id),
                'username': request.user.username,
                'email': request.user.email
            }
        })
    else:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
def session_status_view(request):
    return Response({
        
        'authenticated': request.user.is_authenticated,
        'user': {
            'id': str(request.user.id),
            'username': request.user.username,
            'email': request.user.email
        } if request.user.is_authenticated else None
    })

@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'healthy',
        'message': 'Server is running'
    })

# User Sessions
@csrf_exempt
@api_view(['GET', 'POST'])
def user_sessions_view(request):
    if request.method == 'GET':
        user_id_param = request.GET.get('user_id')
        if not user_id_param:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_id = int(user_id_param)
            user = User.objects.get(id=user_id)
            sessions = UserSession.objects.filter(user=user)
            
            # Get active session (running or pending)
            active_session = sessions.filter(status__in=['running', 'pending']).first()
            
            # Serialize sessions
            def serialize_session(session):
                return {
                    'id': str(session.id),
                    'job_id': session.job_id,
                    'user_id': str(session.user.id),
                    'status': session.status,
                    'progress': session.progress,
                    'message': session.message,
                    'error': session.error,
                    'urls': session.urls,
                    'started_at': session.started_at.isoformat(),
                    'updated_at': session.updated_at.isoformat(),
                    'completed_at': session.completed_at.isoformat() if session.completed_at else None
                }
            
            return Response({
                'active_session': serialize_session(active_session) if active_session else None,
                'all_sessions': [serialize_session(session) for session in sessions[:10]]
            })
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = int(data.get('user_id'))
            job_id = data.get('job_id')
            urls = data.get('urls', [])
            
            if not user_id or not job_id:
                return Response({'error': 'user_id and job_id are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.get(id=user_id)
            
            session = UserSession.objects.create(
                job_id=job_id,
                user=user,
                urls=urls,
                status=data.get('status', 'pending'),
                progress=data.get('progress', 0)
            )
            
            return Response({
                'id': str(session.id),
                'job_id': session.job_id,
                'user_id': str(session.user.id),
                'status': session.status,
                'progress': session.progress,
                'urls': session.urls,
                'started_at': session.started_at.isoformat(),
                'updated_at': session.updated_at.isoformat()
            }, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(['PATCH', 'DELETE'])
@permission_classes([AllowAny])
def user_session_detail_view(request, job_id):
    try:
        session = UserSession.objects.get(job_id=job_id)
        
        if request.method == 'PATCH':
            data = json.loads(request.body)
            
            if 'status' in data:
                session.status = data['status']
            if 'progress' in data:
                session.progress = data['progress']
            if 'message' in data:
                session.message = data['message']
            if 'error' in data:
                session.error = data['error']
            
            if data.get('status') == 'completed':
                session.completed_at = timezone.now()
            
            session.save()
            
            return Response({
                'id': str(session.id),
                'job_id': session.job_id,
                'user_id': str(session.user.id),
                'status': session.status,
                'progress': session.progress,
                'message': session.message,
                'error': session.error,
                'urls': session.urls,
                'started_at': session.started_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
                'completed_at': session.completed_at.isoformat() if session.completed_at else None
            })
        
        elif request.method == 'DELETE':
            session.delete()
            return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)
            
    except UserSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

# Crawl Sessions
@csrf_exempt
@api_view(['GET', 'POST'])
def crawl_sessions_view(request):
    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        limit = int(request.GET.get('limit', 10))
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                sessions = CrawlSession.objects.filter(user=user)[:limit]
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            sessions = CrawlSession.objects.all()[:limit]
        
        def serialize_crawl_session(session):
            return {
                'id': str(session.id),
                'job_id': session.job_id,
                'user_id': str(session.user.id),
                'urls': session.urls,
                'status': session.status,
                'progress': session.progress,
                'results': session.results,
                'error': session.error,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat()
            }
        
        return Response({
            'results': [serialize_crawl_session(session) for session in sessions]
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id', 'default')
            job_id = data.get('job_id')
            urls = data.get('urls', [])
            
            if not job_id:
                return Response({'error': 'job_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Try to get user, create default if needed
            try:
                if user_id == 'default':
                    user, created = User.objects.get_or_create(
                        username='default_user',
                        defaults={'email': 'default@example.com'}
                    )
                else:
                    user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
            session = CrawlSession.objects.create(
                job_id=job_id,
                user=user,
                urls=urls,
                status=data.get('status', 'pending'),
                progress=data.get('progress', 0)
            )
            
            return Response({
                'id': str(session.id),
                'job_id': session.job_id,
                'user_id': str(session.user.id),
                'urls': session.urls,
                'status': session.status,
                'progress': session.progress,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat()
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(['GET', 'PATCH', 'DELETE'])
def crawl_session_detail_view(request, session_id):
    try:
        session = CrawlSession.objects.get(id=session_id)
        
        if request.method == 'GET':
            return Response({
                'id': str(session.id),
                'job_id': session.job_id,
                'user_id': str(session.user.id),
                'urls': session.urls,
                'status': session.status,
                'progress': session.progress,
                'results': session.results,
                'error': session.error,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat()
            })
        
        elif request.method == 'PATCH':
            data = json.loads(request.body)
            
            if 'status' in data:
                session.status = data['status']
            if 'progress' in data:
                session.progress = data['progress']
            if 'results' in data:
                session.results = data['results']
            if 'error' in data:
                session.error = data['error']
            
            session.save()
            
            return Response({
                'id': str(session.id),
                'job_id': session.job_id,
                'user_id': str(session.user.id),
                'urls': session.urls,
                'status': session.status,
                'progress': session.progress,
                'results': session.results,
                'error': session.error,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat()
            })
        
        elif request.method == 'DELETE':
            session.delete()
            return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)
            
    except CrawlSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)



from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ScheduledJob
from .serializers import ScheduledJobSerializer

@api_view(['GET', 'POST'])
def scheduled_jobs_view(request):
    if request.method == 'GET':
        jobs = ScheduledJob.objects.all()
        serializer = ScheduledJobSerializer(jobs, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = ScheduledJobSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['PUT', 'DELETE'])
def scheduled_job_detail_view(request, pk):
    try:
        job = ScheduledJob.objects.get(pk=pk)
    except ScheduledJob.DoesNotExist:
        return Response({'error': 'Job not found'}, status=404)

    if request.method == 'PUT':
        serializer = ScheduledJobSerializer(job, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == 'DELETE':
        job.delete()
        return Response(status=204)
