# # # from .models import CrawlJob, Category, Product, ProductChangeLog
# # # from django.utils.timezone import now
# # # from django.db import IntegrityError, transaction
# # # from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
# # # import logging

# # # logger = logging.getLogger(__name__)

# # # def parse_price(price_str):
# # #     try:
# # #         cleaned = price_str.replace(',', '').replace('$', '').strip()
# # #         return Decimal(cleaned)
# # #     except (InvalidOperation, AttributeError):
# # #         return Decimal('0.00')

# # # def normalize_decimal(value):
# # #     if not isinstance(value, Decimal):
# # #         value = Decimal(value)
# # #     return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

# # # def save_crawled_data_to_db(job_id, urls, all_product_data):
# # #     try:
# # #         crawl_job = CrawlJob.objects.create(job_id=job_id, urls=urls)
# # #         crawled_category_urls = [cat['url'] for cat in all_product_data]

# # #         existing_products_by_category = {}
# # #         for product in Product.objects.select_related('category').all():
# # #             category_url = product.category.url
# # #             if category_url not in existing_products_by_category:
# # #                 existing_products_by_category[category_url] = {}
# # #             existing_products_by_category[category_url][product.product_url] = product

# # #         crawled_product_urls_by_category = {}

# # #         for category_data in all_product_data:
# # #             category_url = category_data['url']
# # #             category, _ = Category.objects.get_or_create(url=category_url)
# # #             if category_url not in crawled_product_urls_by_category:
# # #                 crawled_product_urls_by_category[category_url] = set()

# # #             for product in category_data['products']:
# # #                 product_url = product['product_url']
# # #                 crawled_product_urls_by_category[category_url].add(product_url)

# # #                 existing = existing_products_by_category.get(category_url, {}).get(product_url)

# # #                 new_price = parse_price(product['price'])
# # #                 normalized_new_price = normalize_decimal(new_price)

# # #                 if existing:
# # #                     changes = {}
# # #                     normalized_existing_price = normalize_decimal(existing.price)

# # #                     last_change_date_str = existing.change_date.isoformat() if existing.change_date else None

# # #                     if normalized_existing_price != normalized_new_price:
# # #                         changes['price'] = {
# # #                             'old': str(existing.price),
# # #                             'old_date': last_change_date_str,
# # #                             'new': str(normalized_new_price),
# # #                             'change_date': now().isoformat()
# # #                         }

# # #                     if existing.details != product['product_details']:
# # #                         changes['details'] = {
# # #                             'old': existing.details,
# # #                             'old_date': last_change_date_str,
# # #                             'new': product['product_details'],
# # #                             'change_date': now().isoformat()
# # #                         }

# # #                     if changes:
# # #                         ProductChangeLog.objects.create(
# # #                             crawl_job=crawl_job,
# # #                             change_type='updated',
# # #                             product_url=product_url,
# # #                             data={
# # #                                 'name': product['name'],
# # #                                 'price': str(normalized_new_price),
# # #                                 'product_url': product_url,
# # #                                 'image_url': product['image_url'],
# # #                                 'details': product['product_details'],
# # #                                 'category': category.url,
# # #                                 'changes': changes,
# # #                                 'change_date': now().isoformat()
# # #                             }
# # #                         )

# # #                     # update product fields
# # #                     existing.price = normalized_new_price
# # #                     existing.details = product['product_details']
# # #                     existing.image_url = product['image_url']
# # #                     existing.name = product['name']
# # #                     existing.category = category
# # #                     existing.crawl_job = crawl_job
# # #                     existing.change_date = now()   # important: update change_date on update
# # #                     existing.save()
# # #                 else:
# # #                     try:
# # #                         with transaction.atomic():
# # #                             new_product = Product.objects.create(
# # #                                 category=category,
# # #                                 name=product['name'],
# # #                                 price=normalized_new_price,
# # #                                 product_url=product_url,
# # #                                 image_url=product['image_url'],
# # #                                 details=product['product_details'],
# # #                                 crawl_job=crawl_job,
# # #                                 change_date=now()  # set change_date on new product
# # #                             )
# # #                             ProductChangeLog.objects.create(
# # #                                 crawl_job=crawl_job,
# # #                                 change_type='new',
# # #                                 product_url=product_url,
# # #                                 data={
# # #                                     'name': product['name'],
# # #                                     'price': str(normalized_new_price),
# # #                                     'product_url': product_url,
# # #                                     'image_url': product['image_url'],
# # #                                     'details': product['product_details'],
# # #                                     'category': category.url,
# # #                                     'change_date': now().isoformat()
# # #                                 }
# # #                             )
# # #                     except IntegrityError:
# # #                         logger.warning(f"Duplicate product_url detected: {product_url}, skipping insert.")
# # #                         continue

# # #         for category_url in crawled_product_urls_by_category:
# # #             existing_products = existing_products_by_category.get(category_url, {})
# # #             crawled_urls = crawled_product_urls_by_category[category_url]

# # #             for url, product in existing_products.items():
# # #                 if url not in crawled_urls:
# # #                     ProductChangeLog.objects.create(
# # #                         crawl_job=crawl_job,
# # #                         change_type='removed',
# # #                         product_url=url,
# # #                         data={
# # #                             "name": product.name,
# # #                             "price": str(product.price),
# # #                             "product_url": product.product_url,
# # #                             "image_url": product.image_url,
# # #                             "details": product.details,
# # #                             "category": product.category.url,
# # #                             'change_date': now().isoformat()
# # #                         }
# # #                     )
# # #                     product.delete()

# # #         crawl_job.completed_at = now()
# # #         crawl_job.save()

# # #     except Exception as e:
# # #         logger.error(f"Error in saving crawled data: {str(e)}", exc_info=True)



    

# # from .models import CrawlJob, Category, Product, ProductChangeLog
# # from django.utils.timezone import now
# # from django.db import IntegrityError, transaction
# # from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
# # import logging

# # logger = logging.getLogger(__name__)

# # def parse_price(price_str):
# #     try:
# #         cleaned = price_str.replace(',', '').replace('$', '').strip()
# #         return Decimal(cleaned)
# #     except (InvalidOperation, AttributeError):
# #         return Decimal('0.00')

# # def normalize_decimal(value):
# #     if not isinstance(value, Decimal):
# #         value = Decimal(value)
# #     return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)




# # def save_single_url_data_to_db(job_id, url_data):
# #     try:
# #         # Get or create crawl job
# #         crawl_job, created = CrawlJob.objects.get_or_create(job_id=job_id, defaults={'urls': [url_data['url']]})
        
# #         # If job already exists, append the URL if not present
# #         if not created and url_data['url'] not in crawl_job.urls:
# #             crawl_job.urls.append(url_data['url'])
# #             crawl_job.save()

# #         category_url = url_data['url']
# #         category, _ = Category.objects.get_or_create(url=category_url)

# #         existing_products = {
# #             p.product_url: p for p in Product.objects.filter(category=category)
# #         }

# #         crawled_product_urls = set()

# #         for product in url_data.get('products', []):
# #             product_url = product['product_url']
# #             crawled_product_urls.add(product_url)

# #             new_price = parse_price(product['price'])
# #             normalized_new_price = normalize_decimal(new_price)
# #             existing = existing_products.get(product_url)

# #             if existing:
# #                 changes = {}
# #                 normalized_existing_price = normalize_decimal(existing.price)

# #                 last_change_date_str = existing.change_date.isoformat() if existing.change_date else None

# #                 if normalized_existing_price != normalized_new_price:
# #                     changes['price'] = {
# #                         'old': str(existing.price),
# #                         'old_date': last_change_date_str,
# #                         'new': str(normalized_new_price),
# #                         'change_date': now().isoformat()
# #                     }

# #                 if existing.details != product['product_details']:
# #                     changes['details'] = {
# #                         'old': existing.details,
# #                         'old_date': last_change_date_str,
# #                         'new': product['product_details'],
# #                         'change_date': now().isoformat()
# #                     }

# #                 if changes:
# #                     ProductChangeLog.objects.create(
# #                         crawl_job=crawl_job,
# #                         change_type='updated',
# #                         product_url=product_url,
# #                         data={
# #                             'name': product['name'],
# #                             'price': str(normalized_new_price),
# #                             'product_url': product_url,
# #                             'image_url': product['image_url'],
# #                             'details': product['product_details'],
# #                             'category': category.url,
# #                             'changes': changes,
# #                             'change_date': now().isoformat()
# #                         }
# #                     )

# #                 existing.name = product['name']
# #                 existing.price = normalized_new_price
# #                 existing.details = product['product_details']
# #                 existing.image_url = product['image_url']
# #                 existing.crawl_job = crawl_job
# #                 existing.change_date = now()
# #                 existing.save()

# #             else:
# #                 try:
# #                     with transaction.atomic():
# #                         new_product = Product.objects.create(
# #                             category=category,
# #                             name=product['name'],
# #                             price=normalized_new_price,
# #                             product_url=product_url,
# #                             image_url=product['image_url'],
# #                             details=product['product_details'],
# #                             crawl_job=crawl_job,
# #                             change_date=now()
# #                         )
# #                         ProductChangeLog.objects.create(
# #                             crawl_job=crawl_job,
# #                             change_type='new',
# #                             product_url=product_url,
# #                             data={
# #                                 'name': product['name'],
# #                                 'price': str(normalized_new_price),
# #                                 'product_url': product_url,
# #                                 'image_url': product['image_url'],
# #                                 'details': product['product_details'],
# #                                 'category': category.url,
# #                                 'change_date': now().isoformat()
# #                             }
# #                         )
# #                 except IntegrityError:
# #                     logger.warning(f"Duplicate product_url detected: {product_url}, skipping insert.")

# #         # Remove products for this category that are not part of this URL crawl (not whole job)
# #         for url, product in existing_products.items():
# #             if url not in crawled_product_urls:
# #                 ProductChangeLog.objects.create(
# #                     crawl_job=crawl_job,
# #                     change_type='removed',
# #                     product_url=url,
# #                     data={
# #                         "name": product.name,
# #                         "price": str(product.price),
# #                         "product_url": product.product_url,
# #                         "image_url": product.image_url,
# #                         "details": product.details,
# #                         "category": product.category.url,
# #                         'change_date': now().isoformat()
# #                     }
# #                 )
# #                 product.delete()

# #         crawl_job.completed_at = now()
# #         crawl_job.save()

# #     except Exception as e:
# #         logger.error(f"Error in saving single URL data: {str(e)}", exc_info=True)



# from .models import CrawlJob, Category, Product, ProductChangeLog
# from django.utils.timezone import now
# from django.db import IntegrityError, transaction, connections
# from django.db.utils import OperationalError
# from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
# import logging
# import time

# logger = logging.getLogger(__name__)

# MAX_RETRIES = 3

# def parse_price(price_str):
#     try:
#         cleaned = price_str.replace(',', '').replace('$', '').strip()
#         return Decimal(cleaned)
#     except (InvalidOperation, AttributeError):
#         return Decimal('0.00')

# def normalize_decimal(value):
#     if not isinstance(value, Decimal):
#         value = Decimal(value)
#     return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

# def save_with_reconnect(obj_create_func, *args, **kwargs):
#     for attempt in range(MAX_RETRIES):
#         try:
#             return obj_create_func(*args, **kwargs)
#         except OperationalError:
#             logger.warning(f"DB connection lost, retrying ({attempt + 1}/{MAX_RETRIES})...")
#             time.sleep(1)
#             connections.close_all()
#     raise Exception("Max retries exceeded during DB operation.")

# def save_single_url_data_to_db(job_id, url_data):
#     try:
#         # Get or create crawl job
#         crawl_job, created = CrawlJob.objects.get_or_create(job_id=job_id, defaults={'urls': [url_data['url']]})

#         # If job already exists, append the URL if not present
#         if not created and url_data['url'] not in crawl_job.urls:
#             crawl_job.urls.append(url_data['url'])
#             crawl_job.save()

#         category_url = url_data['url']
#         category, _ = Category.objects.get_or_create(url=category_url)

#         existing_products = {
#             p.product_url: p for p in Product.objects.filter(category=category)
#         }

#         crawled_product_urls = set()

#         for product in url_data.get('products', []):
#             product_url = product['product_url']
#             crawled_product_urls.add(product_url)

#             new_price = parse_price(product['price'])
#             normalized_new_price = normalize_decimal(new_price)
#             existing = existing_products.get(product_url)

#             if existing:
#                 changes = {}
#                 normalized_existing_price = normalize_decimal(existing.price)

#                 last_change_date_str = existing.change_date.isoformat() if existing.change_date else None

#                 if normalized_existing_price != normalized_new_price:
#                     changes['price'] = {
#                         'old': str(existing.price),
#                         'old_date': last_change_date_str,
#                         'new': str(normalized_new_price),
#                         'change_date': now().isoformat()
#                     }

#                 if existing.details != product['product_details']:
#                     changes['details'] = {
#                         'old': existing.details,
#                         'old_date': last_change_date_str,
#                         'new': product['product_details'],
#                         'change_date': now().isoformat()
#                     }

#                 if changes:
#                     save_with_reconnect(ProductChangeLog.objects.create,
#                         crawl_job=crawl_job,
#                         change_type='updated',
#                         product_url=product_url,
#                         data={
#                             'name': product['name'],
#                             'price': str(normalized_new_price),
#                             'product_url': product_url,
#                             'image_url': product['image_url'],
#                             'details': product['product_details'],
#                             'category': category.url,
#                             'changes': changes,
#                             'change_date': now().isoformat()
#                         }
#                     )

#                 existing.name = product['name']
#                 existing.price = normalized_new_price
#                 existing.details = product['product_details']
#                 existing.image_url = product['image_url']
#                 existing.crawl_job = crawl_job
#                 existing.change_date = now()
#                 existing.save()

#             else:
#                 try:
#                     with transaction.atomic():
#                         new_product = save_with_reconnect(Product.objects.create,
#                             category=category,
#                             name=product['name'],
#                             price=normalized_new_price,
#                             product_url=product_url,
#                             image_url=product['image_url'],
#                             details=product['product_details'],
#                             crawl_job=crawl_job,
#                             change_date=now()
#                         )
#                         save_with_reconnect(ProductChangeLog.objects.create,
#                             crawl_job=crawl_job,
#                             change_type='new',
#                             product_url=product_url,
#                             data={
#                                 'name': product['name'],
#                                 'price': str(normalized_new_price),
#                                 'product_url': product_url,
#                                 'image_url': product['image_url'],
#                                 'details': product['product_details'],
#                                 'category': category.url,
#                                 'change_date': now().isoformat()
#                             }
#                         )
#                 except IntegrityError:
#                     logger.warning(f"Duplicate product_url detected: {product_url}, skipping insert.")

#         for url, product in existing_products.items():
#             if url not in crawled_product_urls:
#                 save_with_reconnect(ProductChangeLog.objects.create,
#                     crawl_job=crawl_job,
#                     change_type='removed',
#                     product_url=url,
#                     data={
#                         "name": product.name,
#                         "price": str(product.price),
#                         "product_url": product.product_url,
#                         "image_url": product.image_url,
#                         "details": product.details,
#                         "category": product.category.url,
#                         'change_date': now().isoformat()
#                     }
#                 )
#                 product.delete()

#         crawl_job.completed_at = now()
#         crawl_job.save()

#     except Exception as e:
#         logger.error(f"Error in saving single URL data: {str(e)}", exc_info=True)



from .models import CrawlJob, Category, Product, ProductChangeLog
from django.utils.timezone import now
from django.db import IntegrityError, transaction, connections
from django.db.utils import OperationalError
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import logging
import time

logger = logging.getLogger(__name__)
MAX_RETRIES = 3

def parse_price(price_str):
    try:
        cleaned = price_str.replace(',', '').replace('$', '').strip()
        return Decimal(cleaned)
    except (InvalidOperation, AttributeError):
        return Decimal('0.00')

def normalize_decimal(value):
    if not isinstance(value, Decimal):
        value = Decimal(value)
    return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def save_with_reconnect(callable_func, *args, **kwargs):
    for attempt in range(MAX_RETRIES):
        try:
            return callable_func(*args, **kwargs)
        except OperationalError as e:
            logger.warning(f"DB connection lost, retrying ({attempt + 1}/{MAX_RETRIES})...")
            time.sleep(1)
            connections.close_all()
    raise Exception("Max retries exceeded during DB operation.")

# def save_single_url_data_to_db(job_id, url_data):
#     try:
#         # Get or create crawl job
#         crawl_job, created = CrawlJob.objects.get_or_create(job_id=job_id, defaults={'urls': [url_data['url']]})

#         # If job already exists, append the URL if not present
#         if not created and url_data['url'] not in crawl_job.urls:
#             crawl_job.urls.append(url_data['url'])
#             save_with_reconnect(crawl_job.save)

#         category_url = url_data['url']
#         category, _ = Category.objects.get_or_create(url=category_url)

#         existing_products = {
#             p.product_url: p for p in Product.objects.filter(category=category)
#         }

#         crawled_product_urls = set()

#         for product in url_data.get('products', []):
#             product_url = product['product_url']
#             crawled_product_urls.add(product_url)

#             new_price = parse_price(product['price'])
#             normalized_new_price = normalize_decimal(new_price)
#             existing = existing_products.get(product_url)

#             if existing:
#                 changes = {}
#                 normalized_existing_price = normalize_decimal(existing.price)

#                 last_change_date_str = existing.change_date.isoformat() if existing.change_date else None

#                 if normalized_existing_price != normalized_new_price:
#                     changes['price'] = {
#                         'old': str(existing.price),
#                         'old_date': last_change_date_str,
#                         'new': str(normalized_new_price),
#                         'change_date': now().isoformat()
#                     }

#                 if existing.details != product['product_details']:
#                     changes['details'] = {
#                         'old': existing.details,
#                         'old_date': last_change_date_str,
#                         'new': product['product_details'],
#                         'change_date': now().isoformat()
#                     }

#                 if changes:
#                     save_with_reconnect(ProductChangeLog.objects.create,
#                         crawl_job=crawl_job,
#                         change_type='updated',
#                         product_url=product_url,
#                         data={
#                             'name': product['name'],
#                             'price': str(normalized_new_price),
#                             'product_url': product_url,
#                             'image_url': product['image_url'],
#                             'details': product['product_details'],
#                             'category': category.url,
#                             'changes': changes,
#                             'change_date': now().isoformat()
#                         }
#                     )

#                 # Update and save the existing product
#                 existing.name = product['name']
#                 existing.price = normalized_new_price
#                 existing.details = product['product_details']
#                 existing.image_url = product['image_url']
#                 existing.crawl_job = crawl_job
#                 existing.change_date = now()
#                 save_with_reconnect(existing.save)

#             else:
#                 try:
#                     with transaction.atomic():
#                         new_product = save_with_reconnect(Product.objects.create,
#                             category=category,
#                             name=product['name'],
#                             price=normalized_new_price,
#                             product_url=product_url,
#                             image_url=product['image_url'],
#                             details=product['product_details'],
#                             crawl_job=crawl_job,
#                             change_date=now()
#                         )
#                         save_with_reconnect(ProductChangeLog.objects.create,
#                             crawl_job=crawl_job,
#                             change_type='new',
#                             product_url=product_url,
#                             data={
#                                 'name': product['name'],
#                                 'price': str(normalized_new_price),
#                                 'product_url': product_url,
#                                 'image_url': product['image_url'],
#                                 'details': product['product_details'],
#                                 'category': category.url,
#                                 'change_date': now().isoformat()
#                             }
#                         )
#                 except IntegrityError:
#                     logger.warning(f"Duplicate product_url detected: {product_url}, skipping insert.")

#         # Remove products for this category that were not in this crawl
#         for url, product in existing_products.items():
#             if url not in crawled_product_urls:
#                 save_with_reconnect(ProductChangeLog.objects.create,
#                     crawl_job=crawl_job,
#                     change_type='removed',
#                     product_url=url,
#                     data={
#                         "name": product.name,
#                         "price": str(product.price),
#                         "product_url": product.product_url,
#                         "image_url": product.image_url,
#                         "details": product.details,
#                         "category": product.category.url,
#                         'change_date': now().isoformat()
#                     }
#                 )
#                 save_with_reconnect(product.delete)

#         crawl_job.completed_at = now()
#         save_with_reconnect(crawl_job.save)

#     except Exception as e:
#         logger.error(f"Error in saving single URL data: {str(e)}", exc_info=True)



def save_single_url_data_to_db(job_id, url_data):
    try:
        # Get or create crawl job
        crawl_job, created = CrawlJob.objects.get_or_create(job_id=job_id, defaults={'urls': [url_data['url']]})

        # If job already exists, append the URL if not present
        if not created and url_data['url'] not in crawl_job.urls:
            crawl_job.urls.append(url_data['url'])
            save_with_reconnect(crawl_job.save)

        category_url = url_data['url']
        category, _ = Category.objects.get_or_create(url=category_url)

        # Get all product URLs from the incoming data
        product_urls = [p['product_url'] for p in url_data.get('products', [])]

        # Fetch all existing products with those URLs (regardless of category)
        existing_products = {
            p.product_url: p for p in Product.objects.filter(product_url__in=product_urls)
        }

        crawled_product_urls = set()

        for product in url_data.get('products', []):
            product_url = product['product_url']
            crawled_product_urls.add(product_url)

            new_price = parse_price(product['price'])
            normalized_new_price = normalize_decimal(new_price)
            existing = existing_products.get(product_url)

            if existing:
                changes = {}
                normalized_existing_price = normalize_decimal(existing.price)
                last_change_date_str = existing.change_date.isoformat() if existing.change_date else None

                if normalized_existing_price != normalized_new_price:
                    changes['price'] = {
                        'old': str(existing.price),
                        'old_date': last_change_date_str,
                        'new': str(normalized_new_price),
                        'change_date': now().isoformat()
                    }

                if existing.details != product['product_details']:
                    changes['details'] = {
                        'old': existing.details,
                        'old_date': last_change_date_str,
                        'new': product['product_details'],
                        'change_date': now().isoformat()
                    }

                if changes:
                    save_with_reconnect(ProductChangeLog.objects.create,
                        crawl_job=crawl_job,
                        change_type='updated',
                        product_url=product_url,
                        data={
                            'name': product['name'],
                            'price': str(normalized_new_price),
                            'product_url': product_url,
                            'image_url': product['image_url'],
                            'details': product['product_details'],
                            'category': category.url,
                            'changes': changes,
                            'change_date': now().isoformat()
                        }
                    )

                # Update and save the existing product
                existing.name = product['name']
                existing.price = normalized_new_price
                existing.details = product['product_details']
                existing.image_url = product['image_url']
                existing.category = category  # optional: update to new category
                existing.crawl_job = crawl_job
                existing.change_date = now()
                save_with_reconnect(existing.save)

            else:
                try:
                    with transaction.atomic():
                        new_product = save_with_reconnect(Product.objects.create,
                            category=category,
                            name=product['name'],
                            price=normalized_new_price,
                            product_url=product_url,
                            image_url=product['image_url'],
                            details=product['product_details'],
                            crawl_job=crawl_job,
                            change_date=now()
                        )
                        save_with_reconnect(ProductChangeLog.objects.create,
                            crawl_job=crawl_job,
                            change_type='new',
                            product_url=product_url,
                            data={
                                'name': product['name'],
                                'price': str(normalized_new_price),
                                'product_url': product_url,
                                'image_url': product['image_url'],
                                'details': product['product_details'],
                                'category': category.url,
                                'change_date': now().isoformat()
                            }
                        )
                except IntegrityError:
                    logger.warning(f"Duplicate product_url detected during insert: {product_url}")
                    # Optionally update if race condition caused the failure
                    existing = Product.objects.get(product_url=product_url)
                    existing.name = product['name']
                    existing.price = normalized_new_price
                    existing.details = product['product_details']
                    existing.image_url = product['image_url']
                    existing.category = category
                    existing.crawl_job = crawl_job
                    existing.change_date = now()
                    save_with_reconnect(existing.save)

        # Remove products that existed in the DB but were not in this crawl
        existing_product_urls = set(existing_products.keys())
        stale_urls = existing_product_urls - crawled_product_urls

        for url in stale_urls:
            product = existing_products[url]
            if product.category == category:  # only delete if it belongs to this category
                save_with_reconnect(ProductChangeLog.objects.create,
                    crawl_job=crawl_job,
                    change_type='removed',
                    product_url=url,
                    data={
                        "name": product.name,
                        "price": str(product.price),
                        "product_url": product.product_url,
                        "image_url": product.image_url,
                        "details": product.details,
                        "category": product.category.url,
                        'change_date': now().isoformat()
                    }
                )
                save_with_reconnect(product.delete)

        crawl_job.completed_at = now()
        save_with_reconnect(crawl_job.save)

    except Exception as e:
        logger.error(f"Error in saving single URL data: {str(e)}", exc_info=True)
