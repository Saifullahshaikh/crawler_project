# app/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('crawl/', views.start_crawl, name='start_crawl'),
    path('crawl/status', views.get_job_status, name='get_job_status'),
    path('categories/', views.get_categories, name='get_categories'),
    path('products/', views.get_products, name='get_products'),
    path('product-changes/', views.get_product_changes, name='product_changes'),
    # Authentication
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/profile/', views.profile_view, name='profile'),
    path('auth/session-status/', views.session_status_view, name='session_status'),
    
    # User Sessions
    path('user-sessions/', views.user_sessions_view, name='user_sessions'),
    path('user-sessions/<str:job_id>/', views.user_session_detail_view, name='user_session_detail'),
    
    # Crawl Sessions
    path('crawl-sessions/', views.crawl_sessions_view, name='crawl_sessions'),
    path('crawl-sessions/<str:session_id>/', views.crawl_session_detail_view, name='crawl_session_detail'),

    #  path('health/', views.health_check, name='health_check'),

    path('scheduler/scheduled-jobs/', views.scheduled_jobs_view, name='scheduled_jobs'),
    path('scheduler/scheduled-jobs/<int:pk>/', views.scheduled_job_detail_view, name='scheduled_job_detail'),
]
