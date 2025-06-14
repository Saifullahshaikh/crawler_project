from django.contrib import admin
from .models import CrawlJob, Category, Product, ProductChangeLog

admin.site.register(CrawlJob)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ProductChangeLog)
