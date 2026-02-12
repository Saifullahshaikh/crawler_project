# import requests
# from bs4 import BeautifulSoup


# class ProductScraper:
#     def __init__(self, url):
#         self.url = url
#         self.headers = {
#             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
#         }
#         self.soup = None

#     def fetch_page(self):
#         response = requests.get(self.url, headers=self.headers)
#         if response.status_code == 403:
#             raise Exception("403 Forbidden: Access Denied")
#         response.raise_for_status()
#         self.soup = BeautifulSoup(response.text, 'html.parser')

#     # def get_image_url(self):
#     #     selectors = [
#     #         ('div', ['woocommerce-product-gallery__image'], None, 'data-thumb'),
#     #         # Case 1: <div> → <a href="...">
#     #         ('div', ['woocommerce-product-gallery__image', 'woocommerce-main-image img-responsive', 'img-thumbnail', 'owl-item active', 'wd-carousel-item'], 'a', 'href'),
#     #         # Case 2: Direct <img src="...">
#     #         ('img', ['woocommerce-main-image', 'wp-post-image'], None, 'src'),
#     #         # Case 3: Fallback <img> with any class
#     #         ('img', [], None, 'src'),
#     #         # Case 4: Try srcset if src is not available
#     #         ('img', [], None, 'srcset'),

#     #         ('figure', ['woocommerce-product-gallery__image'], None, 'data-thumb'),
#     #     ]

#     #     for tag, classes, child_tag, attr in selectors:
#     #         elements = self.soup.find_all(tag, class_=lambda c: c and all(cl in c for cl in classes)) if classes else self.soup.find_all(tag)
#     #         for element in elements:
#     #             if child_tag:
#     #                 child = element.find(child_tag)
#     #                 if child and child.get(attr):
#     #                     return child[attr]
#     #             elif element and element.get(attr):
#     #                 # If we're dealing with srcset, pick the first URL
#     #                 if attr == 'srcset':
#     #                     srcset = element.get('srcset')
#     #                     if srcset:
#     #                         return srcset.split(',')[0].split()[0]  # Extract the first image URL
#     #                 return element[attr]

#     #     return None


#     def get_image_url(self):
#         selectors = [
#             # Case 0: div with data-thumb
#             ('div', ['woocommerce-product-gallery__image'], None, 'data-thumb'),

#             # Case 1: div > a[href]
#             ('div', ['woocommerce-product-gallery__image'], 'a', 'href'),

#             # Case 2: figure > div > a > img[src]
#             ('figure', ['woocommerce-product-gallery__wrapper'], 'img', 'src'),

#             # Case 3: direct img with main classes
#             ('img', ['woocommerce-main-image', 'wp-post-image'], None, 'src'),

#             # Case 4: fallback: any img[src]
#             ('img', [], None, 'src'),

#             # Case 5: fallback: any img[srcset]
#             ('img', [], None, 'srcset'),
#             # Case 6: figure with data-thumb
#             ('figure', ['woocommerce-product-gallery__image'], None, 'data-thumb'),
#         ]

#         for tag, classes, child_tag, attr in selectors:
#             elements = self.soup.find_all(tag, class_=lambda c: c and all(cl in c for cl in classes)) if classes else self.soup.find_all(tag)
#             for element in elements:
#                 if child_tag:
#                     children = element.find_all(child_tag)
#                     for child in children:
#                         if child and child.get(attr):
#                             return self._extract_from_attr(child, attr)
#                 elif element and element.get(attr):
#                     return self._extract_from_attr(element, attr)

#         return None
    
    
#     def _extract_from_attr(self, tag, attr):
#         """Helper to extract a clean image URL from attribute, including srcset."""
#         if attr == 'srcset':
#             srcset = tag.get('srcset')
#             if srcset:
#                 return srcset.split(',')[0].split()[0]
#         return tag.get(attr)


#     def get_thumbnail_images(self):
#         thumbnail_div = self.soup.find('div', id=['product-thumbnail-images', 'product-thumbs-vertical-slider', 'product-thumbnails']) or self.soup.find('div', class_=['product-gallery', 'product-thumbnails', 'thumbnails', 'wd-carousel-inner', 'wd-gallery-thumb', 'product-images-summary', 'avada-single-product-gallery-wrapper', 'woocommerce-product-gallery'])
#         thumbnails = []
#         if thumbnail_div:
#             img_tags = thumbnail_div.find_all('img')
#             for img in img_tags:
#                 src = img.get('src')
#                 if src:
#                     thumbnails.append(src)

#         # Also check <ol class="flex-control-nav flex-control-thumbs">
#         ol_tag = self.soup.find('ol', class_='flex-control-nav flex-control-thumbs')
#         if ol_tag:
#             li_tags = ol_tag.find_all('li')
#             for li in li_tags:
#                 img = li.find('img')
#                 if img:
#                     src = img.get('src')
#                     if src and src not in thumbnails:
#                         thumbnails.append(src)

#         return thumbnails




#     def get_title(self):
#         for tag, class_name in [
#             ('h1', 'product-title'),
#             ('h1', 'product_title entry-title'),
#             ('h1', 'product-title entry-title'),
#             ('h1', 'fusion-title-heading'),
#             ('h2', 'product_title entry-title')
#         ]:
#             title_tag = self.soup.find(tag, class_=class_name)
#             if title_tag:
#                 return title_tag.get_text(strip=True)
#         return "Title not found"


#     def get_rating_and_reviews(self):
#         rating_div = self.soup.find('div', class_='woocommerce-product-rating')
#         rating = None
#         customer_reviews = None
#         if rating_div:
#             rating_value = rating_div.find('strong', class_='rating')
#             rating = rating_value.get_text(strip=True) if rating_value else "No rating"
#             reviews_count = rating_div.find('span', class_='count')
#             customer_reviews = reviews_count.get_text(strip=True) if reviews_count else "0 reviews"
#         return rating, customer_reviews

#     def get_size_options(self):
#         size_select = self.soup.find('select', class_=['woo-variation-raw-select', 'attribute_pa_size']) or self.soup.find('select', id=['pa_size','size', 'sze'])
#         if size_select:
#             return [option.get_text(strip=True) for option in size_select.find_all('option')]

#         size_ul = self.soup.find('ul', class_='variable-items-wrapper')
#         if size_ul:
#             return [li.get('data-wvstooltip') for li in size_ul.find_all('li') if li.get('data-wvstooltip')]
#         return []

#     def get_product_specification(self):
#         spec_div = self.soup.find('div', class_=['product-short-description', 'shor-description-main', 'short-description-main', 'wd-accordion-content'])
#         if not spec_div:
#             spec_div = self.soup.find('div', class_='woocommerce-product-details__short-description') 

#         if spec_div:
#             spec_list = spec_div.find_all('li')
#             return [spec.get_text(strip=True) for spec in spec_list]
#         return None

#     def get_prices(self):
#         previous_price = None
#         new_price = None
#         price_range = []

#         # Find all possible price containers
#         price_containers = self.soup.find_all(['div', 'p'], class_=['price', 'price-wrapper'])

#         # Look for the first container that contains real price info
#         for container in price_containers:
#             # --- NEW PRICE ---
#             for ins_tag in container.find_all('ins'):
#                 ins_price = ins_tag.find('span', class_='woocommerce-Price-amount')
#                 if ins_price and ins_price.get_text(strip=True):
#                     new_price = ins_price.get_text(strip=True)
#                     break
#                 elif ins_tag.get_text(strip=True):
#                     new_price = ins_tag.get_text(strip=True)
#                     break
#             # --- PREVIOUS PRICE ---
#             for del_tag in container.find_all('del'):
#                 del_price = del_tag.find('span', class_='woocommerce-Price-amount')
#                 if del_price and del_price.get_text(strip=True):
#                     previous_price = del_price.get_text(strip=True)
#                     break
#                 elif del_tag.get_text(strip=True):
#                     previous_price = del_tag.get_text(strip=True)
#                     break

#             # If both found, break early
#             if new_price or previous_price:
#                 break

#         # --- PRICE RANGE ---
#         price_amounts = self.soup.find_all('span', class_='woocommerce-Price-amount')
#         for amt in price_amounts:
#             text = amt.get_text(strip=True)
#             if text and text not in price_range:
#                 price_range.append(text)

#         return previous_price, new_price, price_range




#     def scrape(self):
#         self.fetch_page()
#         product_details = {
#             "Image URL": self.get_image_url(),
#             "Thumbnail Images": self.get_thumbnail_images(), 
#             "Title": self.get_title(),
#             "Rating": self.get_rating_and_reviews()[0],
#             "Customer Reviews": self.get_rating_and_reviews()[1],
#             "Size Options": self.get_size_options(),
#             "Product Specification": self.get_product_specification(),
#             "Previous Price": self.get_prices()[0],
#             "New Price": self.get_prices()[1],
#             "Price Range": self.get_prices()[2]
#         }
#         return product_details







import requests
from bs4 import BeautifulSoup
from functools import lru_cache
import logging
from dotenv import load_dotenv
import os
import time
import gc

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

class ProductScraper:
    def __init__(self, url, session):
        self.url = url
        self.session = session
        self.soup = None

    @lru_cache(maxsize=500)
    def fetch_page(self):
        max_retries = 5
        for attempt in range(max_retries):
            try:
                with self.session.get(self.url, timeout=10, stream=True) as response:
                    if response.status_code == 403:
                        raise Exception("403 Forbidden: Access Denied")
                    response.raise_for_status()
                    self.soup = BeautifulSoup(response.text, 'html.parser')
                    return
            except Exception as e:
                logging.warning(f"Attempt {attempt + 1} failed for {self.url}: {e}")
                if attempt + 1 == max_retries:
                    logging.error(f"Max retries reached for {self.url}. Skipping.")
                    raise
                time.sleep(2 ** attempt)
        raise Exception(f"Failed to fetch {self.url} after {max_retries} attempts")

    def get_image_url(self):
        selectors = [
            ('div', ['woocommerce-product-gallery__image'], None, 'data-thumb'),
            ('div', ['woocommerce-product-gallery__image'], 'a', 'href'),
            ('figure', ['woocommerce-product-gallery__wrapper'], 'img', 'src'),
            ('img', ['woocommerce-main-image', 'wp-post-image'], None, 'src'),
            ('img', [], None, 'src'),
            ('img', [], None, 'srcset'),
            ('figure', ['woocommerce-product-gallery__image'], None, 'data-thumb'),
        ]
        for tag, classes, child_tag, attr in selectors:
            elements = self.soup.find_all(tag, class_=lambda c: c and all(cl in c for cl in classes)) if classes else self.soup.find_all(tag)
            for element in elements:
                if child_tag:
                    children = element.find_all(child_tag)
                    for child in children:
                        if child and child.get(attr):
                            return self._extract_from_attr(child, attr)
                elif element and element.get(attr):
                    return self._extract_from_attr(element, attr)
        return None

    def _extract_from_attr(self, tag, attr):
        if attr == 'srcset':
            srcset = tag.get('srcset')
            if srcset:
                return srcset.split(',')[0].split()[0]
        return tag.get(attr)

    def get_thumbnail_images(self):
        thumbnail_div = self.soup.find('div', id=['product-thumbnail-images', 'product-thumbs-vertical-slider', 'product-thumbnails']) or \
                        self.soup.find('div', class_=['product-gallery', 'product-thumbnails', 'thumbnails', 'wd-carousel-inner', 'wd-gallery-thumb', 'product-images-summary', 'avada-single-product-gallery-wrapper', 'woocommerce-product-gallery'])
        thumbnails = []
        if thumbnail_div:
            img_tags = thumbnail_div.find_all('img')
            thumbnails.extend(img.get('src') for img in img_tags if img.get('src'))
        ol_tag = self.soup.find('ol', class_='flex-control-nav flex-control-thumbs')
        if ol_tag:
            li_tags = ol_tag.find_all('li')
            for li in li_tags:
                img = li.find('img')
                if img and img.get('src') and img.get('src') not in thumbnails:
                    thumbnails.append(img.get('src'))
        return thumbnails

    def get_title(self):
        for tag, class_name in [
            ('h1', 'product-title'),
            ('h1', 'product_title entry-title'),
            ('h1', 'product-title entry-title'),
            ('h1', 'fusion-title-heading'),
            ('h2', 'product_title entry-title')
        ]:
            title_tag = self.soup.find(tag, class_=class_name)
            if title_tag:
                return title_tag.get_text(strip=True)
        return "Title not found"

    def get_rating_and_reviews(self):
        rating_div = self.soup.find('div', class_='woocommerce-product-rating')
        rating = "No rating"
        customer_reviews = "0 reviews"
        if rating_div:
            rating_value = rating_div.find('strong', class_='rating')
            rating = rating_value.get_text(strip=True) if rating_value else "No rating"
            reviews_count = rating_div.find('span', class_='count')
            customer_reviews = reviews_count.get_text(strip=True) if reviews_count else "0 reviews"
        return rating, customer_reviews

    def get_size_options(self):
        size_select = self.soup.find('select', class_=['woo-variation-raw-select', 'attribute_pa_size']) or \
                      self.soup.find('select', id=['pa_size', 'size', 'sze'])
        if size_select:
            return [option.get_text(strip=True) for option in size_select.find_all('option')]
        size_ul = self.soup.find('ul', class_='variable-items-wrapper')
        if size_ul:
            return [li.get('data-wvstooltip') for li in size_ul.find_all('li') if li.get('data-wvstooltip')]
        return []

    def get_product_specification(self):
        spec_div = self.soup.find('div', class_=['product-short-description', 'shor-description-main', 'short-description-main', 'wd-accordion-content']) or \
                   self.soup.find('div', class_='woocommerce-product-details__short-description')
        if spec_div:
            spec_list = spec_div.find_all('li')
            return [spec.get_text(strip=True) for spec in spec_list]
        return None

    def get_prices(self):
        previous_price, new_price, price_range = None, None, []
        price_containers = self.soup.find_all(['div', 'p'], class_=['price', 'price-wrapper'])
        for container in price_containers:
            for ins_tag in container.find_all('ins'):
                ins_price = ins_tag.find('span', class_='woocommerce-Price-amount')
                new_price = ins_price.get_text(strip=True) if ins_price and ins_price.get_text(strip=True) else ins_tag.get_text(strip=True)
                if new_price:
                    break
            for del_tag in container.find_all('del'):
                del_price = del_tag.find('span', class_='woocommerce-Price-amount')
                previous_price = del_price.get_text(strip=True) if del_price and del_price.get_text(strip=True) else del_tag.get_text(strip=True)
                if previous_price:
                    break
            if new_price or previous_price:
                break
        price_amounts = self.soup.find_all('span', class_='woocommerce-Price-amount')
        price_range = [amt.get_text(strip=True) for amt in price_amounts if amt.get_text(strip=True) and amt.get_text(strip=True) not in price_range]
        return previous_price, new_price, price_range

    def scrape(self):
        try:
            self.fetch_page()
            data = {
                "Image URL": self.get_image_url(),
                "Thumbnail Images": self.get_thumbnail_images(),
                "Title": self.get_title(),
                "Rating": self.get_rating_and_reviews()[0],
                "Customer Reviews": self.get_rating_and_reviews()[1],
                "Size Options": self.get_size_options(),
                "Product Specification": self.get_product_specification(),
                "Previous Price": self.get_prices()[0],
                "New Price": self.get_prices()[1],
                "Price Range": self.get_prices()[2]
            }
            return data
        finally:
            self.soup = None
            gc.collect()