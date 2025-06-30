from django.db import models


from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from django.utils.timezone import now

class CrawlJob(models.Model):
    job_id = models.CharField(max_length=255, unique=True)  # increased max_length
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    urls = models.JSONField()

    def __str__(self):
        return self.job_id

class Category(models.Model):
    url = models.URLField(max_length=2000, unique=True)  # increased max_length for URL

    def __str__(self):
        return self.url

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=1000)  # name can be long
    price = models.CharField(max_length=100)  # allow bigger prices with currency
    product_url = models.URLField(max_length=2000, unique=True)  # URL fields extended
    image_url = models.URLField(max_length=2000)
    details = models.JSONField()
    crawl_job = models.ForeignKey(CrawlJob, on_delete=models.CASCADE)
    change_date = models.DateTimeField(default=now)

    def __str__(self):
        return self.name

class ProductChangeLog(models.Model):
    CHANGE_TYPE_CHOICES = [
        ('new', 'New'),
        ('updated', 'Updated'),
        ('removed', 'Removed')
    ]
    crawl_job = models.ForeignKey(CrawlJob, on_delete=models.CASCADE)
    change_type = models.CharField(max_length=10, choices=CHANGE_TYPE_CHOICES)
    product_url = models.URLField(max_length=2000)
    data = models.JSONField()

    def __str__(self):
        return f"{self.change_type.upper()} - {self.product_url}"




class UserSession(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_id = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField(default=0)
    message = models.TextField(blank=True, null=True)
    error = models.TextField(blank=True, null=True)
    urls = models.JSONField(default=list)
    started_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.job_id} - {self.status}"

class CrawlSession(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_id = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='crawl_sessions')
    urls = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField(default=0)
    results = models.JSONField(blank=True, null=True)
    error = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.job_id} - {self.status}"

class SavedUrl(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_urls')
    url = models.URLField()
    name = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['user', 'url']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name or self.url} - {self.user.username}"




class ScheduledJob(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    urls = models.JSONField(default=list)
    scheduled_hour = models.IntegerField(null=True, blank=True)
    scheduled_minute = models.IntegerField(null=True, blank=True)
    repeat_days = models.JSONField(default=list, blank=True)
    last_run = models.DateTimeField(null=True, blank=True)

