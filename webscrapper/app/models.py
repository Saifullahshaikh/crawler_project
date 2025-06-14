from django.db import models
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
