from django.contrib import admin
from .models import CrawlJob, Category, Product, ProductChangeLog, UserSession, CrawlSession, SavedUrl, ScheduledJob

admin.site.register(CrawlJob)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ProductChangeLog)

admin.site.register(CrawlSession)

admin.site.register(UserSession)
admin.site.register(SavedUrl)
admin.site.register(ScheduledJob)



