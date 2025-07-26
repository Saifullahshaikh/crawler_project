

# import requests
# from bs4 import BeautifulSoup
# import json
# from tqdm import tqdm
# from .product import ProductScraper
# # from product import ProductScraper

# import sys
# import argparse

# class ProductDataScraper:
#     def __init__(self, headers=None):
#         # self.file_path = file_path
#         self.headers = headers or {
#             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
#         }
#         # self.urls = self.read_urls_from_json()
#         self.all_product_list = []

#     # def read_urls_from_json(self):
#     #     with open(self.file_path, 'r') as file:
#     #         data = json.load(file)
#     #     return data  
    



#     def get_image_url(self, soup):
#         # Get the specific image inside the anchor tag inside .image-zoom_in
#         container = soup.select_one('.box-image .image-zoom_in a')
#         if container:
#             # Prefer the first valid <img> tag with a real src
#             for img_tag in container.find_all('img'):
#                 src = img_tag.get('src', '')
#                 if src.startswith('http') and not src.startswith('data:image'):
#                     return src
                
#                 # Check lazy-load attributes if regular src is missing
#                 for attr in ['data-src', 'data-lazy-src']:
#                     lazy_src = img_tag.get(attr)
#                     if lazy_src and lazy_src.startswith('http'):
#                         return lazy_src

#         return None



#     def scrape_url(self, url):
#         url_data = {
#             "url": url,
#             "products": []
#         }

#         try:
#             response = requests.get(url, headers=self.headers)
#         except Exception as e:
#             print(f"Error while requesting {url}: {e}")
#             return url_data

#         if response.status_code == 200:
#             soup = BeautifulSoup(response.content, "html.parser")

#             # Pattern 2
#             products_div = soup.find_all("div", class_=["product-small", "product-inner", 'fusion-post-cards', 'product'])

#             # Pattern 2b: Also check for <ul class="products"> with <li> children
#             ul_products = soup.find("ul", class_="products")
#             if ul_products:
#                 products_div = products_div or ul_products.find_all("li", recursive=False)    
#             for product in products_div:
#                 name_tag = (
#                     product.find("p", class_=["name", "product-title"]) or
#                     product.find("a", class_="product-loop-title") or 
#                     (
#                         product.find("a", class_="product-loop-title").find("h3", class_=["woocommerce-loop-product__title", "wd-entities-title"])
#                         if product.find("a", class_="product-loop-title") else None
#                     ) or
#                     product.find("h3", class_=["woocommerce-loop-product__title", "wd-entities-title"]) or
#                     product.find("h2", class_=["woocommerce-loop-product__title", "wd-entities-title"])
#                 )
#                 name = name_tag.text.strip() if name_tag else None
#                 price_tag = product.find("span", class_="woocommerce-Price-amount amount")
#                 price = price_tag.text.strip() if price_tag else None
#                 link_tag = product.find("a", href=True)
#                 product_url = link_tag['href'] if link_tag else None
#                 img_tag = product.find("img", class_=["attachment-woocommerce_thumbnail", "wp-post-image", "card-img-top"])
#                 if not img_tag:
#                     image_div = product.find("div", class_=["product-image", "image-zoom_in"])
#                     if image_div:
#                         img_tag = image_div.find("img")
#                 image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else None or self.get_image_url(soup)
#                 product_details = ProductScraper(product_url).scrape() if product_url else {}

#                 url_data["products"].append({
#                     "name": name,
#                     "price": price,
#                     "product_url": product_url,
#                     "image_url": image_url or  product_details.get('Image URL'),
#                     "product_details": product_details
#                 })
#             # Pattern 1
#             products_section = soup.select("div.products section.product")
#             for product in products_section:
#                 name_tag = product.select_one("h3.product-name a")
#                 name = name_tag.text.strip() if name_tag else None
#                 product_url = name_tag['href'] if name_tag and name_tag.has_attr('href') else None
#                 price_tag = product.select_one("span.price ins span.woocommerce-Price-amount") or \
#                             product.select_one("span.price span.woocommerce-Price-amount")
#                 price = price_tag.text.strip() if price_tag else None
#                 img_tag = product.select_one("img.wp-post-image")
#                 image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else None
#                 product_details = ProductScraper(product_url).scrape() if product_url else {}

#                 url_data["products"].append({
#                     "name": name,
#                     "price": price,
#                     "product_url": product_url,
#                     "image_url": image_url or  product_details.get('Image URL'),
#                     "product_details": product_details
#                 })





#             # ✅ Pattern 5: JackFit style
#             product_items = soup.select("li.product-grid-view.product")
#             for item in product_items:
#                 a_tag = item.find("a", href=True)
#                 product_url = a_tag['href'] if a_tag else None

#                 # Fallback: try to find product URL from h4 > a
#                 if not product_url:
#                     h4_tag = item.find("h4", class_="fusion-title-heading")
#                     a_inside_h4 = h4_tag.find("a", href=True) if h4_tag else None
#                     product_url = a_inside_h4['href'] if a_inside_h4 else None

#                 # Try name from title attribute first
#                 name = a_tag['title'] if a_tag and a_tag.has_attr('title') else None

#                 # Fallback: try getting name from h4 > a text
#                 if not name and a_inside_h4:
#                     name = a_inside_h4.get_text(strip=True)

#                 img_tag = item.find("img")
#                 image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else None

#                 price_tag = item.find("span", class_="price") or item.find("span", class_="woocommerce-Price-amount")
#                 price = price_tag.get_text(strip=True) if price_tag else None

#                 product_details = ProductScraper(product_url).scrape() if product_url else {}

#                 url_data["products"].append({
#                     "name": name,
#                     "price": price,
#                     "product_url": product_url,
#                     "image_url": image_url or  product_details.get('Image URL'),
#                     "product_details": product_details
#                 })


#         else:
#             print(f"Failed to retrieve the page {url}. Status code: {response.status_code}")

#         return url_data



#     # def scrape_all_urls(self):
#     #     for url in tqdm(self.urls, desc="Processing URLs", unit="url"):
#     #         if not url:
#     #             print("Skipped empty URL.")
#     #             continue
#     #         url_data = self.scrape_url(url)
#     #         self.all_product_list.append(url_data)

#     def save_to_json(self, output_file_path):
#         with open(output_file_path, 'w') as json_file:
#             json.dump(self.all_product_list, json_file, indent=4)
#         print(f"Product data has been saved to {output_file_path}")




import requests
from bs4 import BeautifulSoup
from .product import ProductScraper
from concurrent.futures import ThreadPoolExecutor
import logging
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Proxy details
proxy_host = os.getenv('PROXY_HOST')
proxy_port = os.getenv('PROXY_PORT')
proxy_protocol = os.getenv('PROXY_PROTOCOL')
proxy_user = os.getenv('PROXY_USER')
proxy_pass = os.getenv('PROXY_PASS')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Proxy configuration
proxy_url = f"{proxy_protocol}://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}"
proxies = {
    'http': proxy_url,
    'https': proxy_url
}

class ProductDataScraper:
    def __init__(self, headers=None):
        self.headers = headers or {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.session.proxies.update(proxies)

    def get_image_url(self, soup):
        container = soup.select_one('.box-image .image-zoom_in a')
        if container:
            for img_tag in container.find_all('img'):
                src = img_tag.get('src', '')
                if src.startswith('http') and not src.startswith('data:image'):
                    return src
                for attr in ['data-src', 'data-lazy-src']:
                    lazy_src = img_tag.get(attr)
                    if lazy_src and lazy_src.startswith('http'):
                        return lazy_src
        return None

    def scrape_url(self, url):
        url_data = {"url": url, "products": []}
        try:
            response = self.session.get(url, timeout=5)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "html.parser")

            # Pattern 2: Product divs
            products_div = soup.find_all("div", class_=["product-small", "product-inner", 'fusion-post-cards', 'product'])
            ul_products = soup.find("ul", class_="products")
            if ul_products:
                products_div = products_div or ul_products.find_all("li", recursive=False)

            def process_product(product):
                name_tag = (
                    product.find("p", class_=["name", "product-title"]) or
                    product.find("a", class_="product-loop-title") or
                    (
                        product.find("a", class_="product-loop-title").find("h3", class_=["woocommerce-loop-product__title", "wd-entities-title"])
                        if product.find("a", class_="product-loop-title") else None
                    ) or
                    product.find("h3", class_=["woocommerce-loop-product__title", "wd-entities-title"]) or
                    product.find("h2", class_=["woocommerce-loop-product__title", "wd-entities-title"])
                )
                name = name_tag.text.strip() if name_tag else None
                price_tag = product.find("span", class_="woocommerce-Price-amount amount")
                price = price_tag.text.strip() if price_tag else None
                link_tag = product.find("a", href=True)
                product_url = link_tag['href'] if link_tag else None
                img_tag = product.find("img", class_=["attachment-woocommerce_thumbnail", "wp-post-image", "card-img-top"])
                if not img_tag:
                    image_div = product.find("div", class_=["product-image", "image-zoom_in"])
                    if image_div:
                        img_tag = image_div.find("img")
                image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else self.get_image_url(soup)
                product_details = ProductScraper(product_url).scrape() if product_url else {}
                if product_details.get('Thumbnail Images') and len(product_details.get('Thumbnail Images')) > 1:
                    image_url_final = product_details.get('Thumbnail Images')[1]
                elif product_details.get('Thumbnail Images') and len(product_details.get('Thumbnail Images')) > 0:
                    image_url_final = product_details.get('Thumbnail Images')[0]
                elif product_details.get('Image URL'):
                    image_url_final = product_details.get('Image URL')
                else:
                    image_url_final = image_url

                return {
                    "name": name,
                    "price": price,
                    "product_url": product_url,
                    "image_url": image_url_final,
                    "product_details": product_details
                }

            # Pattern 1: Products section
            def process_section_product(product):
                name_tag = product.select_one("h3.product-name a")
                name = name_tag.text.strip() if name_tag else None
                product_url = name_tag['href'] if name_tag and name_tag.has_attr('href') else None
                price_tag = product.select_one("span.price ins span.woocommerce-Price-amount") or \
                            product.select_one("span.price span.woocommerce-Price-amount")
                price = price_tag.text.strip() if price_tag else None
                img_tag = product.select_one("img.wp-post-image")
                image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else None
                product_details = ProductScraper(product_url).scrape() if product_url else {}
                return {
                    "name": name,
                    "price": price,
                    "product_url": product_url,
                    "image_url": product_details.get('Thumbnail Images')[0] or product_details.get('Image URL') or image_url,
                    "product_details": product_details
                }

            # Pattern 5: JackFit style
            def process_jackfit_product(item):
                a_tag = item.find("a", href=True)
                product_url = a_tag['href'] if a_tag else None
                if not product_url:
                    h4_tag = item.find("h4", class_="fusion-title-heading")
                    a_inside_h4 = h4_tag.find("a", href=True) if h4_tag else None
                    product_url = a_inside_h4['href'] if a_inside_h4 else None
                name = a_tag['title'] if a_tag and a_tag.has_attr('title') else None
                if not name and a_inside_h4:
                    name = a_inside_h4.get_text(strip=True)
                img_tag = item.find("img")
                image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else None
                price_tag = item.find("span", class_="price") or item.find("span", class_="woocommerce-Price-amount")
                price = price_tag.get_text(strip=True) if price_tag else None
                product_details = ProductScraper(product_url).scrape() if product_url else {}
                return {
                    "name": name,
                    "price": price,
                    "product_url": product_url,
                    "image_url": product_details.get('Thumbnail Images')[0] or product_details.get('Image URL') or image_url,
                    "product_details": product_details
                }

            # Parallel processing of products
            with ThreadPoolExecutor(max_workers=10) as executor:
                products = list(executor.map(process_product, products_div))
                products.extend(executor.map(process_section_product, soup.select("div.products section.product")))
                products.extend(executor.map(process_jackfit_product, soup.select("li.product-grid-view.product")))
            url_data["products"] = [p for p in products if p["name"] and p["product_url"]]
            logging.info(f"Scraped {len(url_data['products'])} products from {url}")
        except Exception as e:
            logging.error(f"Failed to retrieve {url}: {e}")
        return url_data