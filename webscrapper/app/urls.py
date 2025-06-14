# app/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('crawl/', views.start_crawl, name='start_crawl'),
    path('crawl/status', views.get_job_status, name='get_job_status'),
    path('categories/', views.get_categories, name='get_categories'),
    path('products/', views.get_products, name='get_products'),
    path('product-changes/', views.get_product_changes, name='product_changes'),
]
