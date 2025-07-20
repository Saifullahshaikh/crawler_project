import json
import time
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import os
import re
import time
from urllib.parse import urlparse, urljoin
from .scrapper import ProductDataScraper 
import json
import time
import platform
from urllib.parse import urlparse, urljoin
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from .utils import save_single_url_data_to_db



def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def get_word_sequences(words, min_len=2):
    sequences = []
    for i in range(len(words)):
        for j in range(i + min_len, len(words) + 1):
            sequences.append('-'.join(words[i:j]))
    return sequences


def has_matching_sequence(heading_slug, url_slug):
    heading_parts = heading_slug.split('-')
    url_parts = url_slug.split('-')

    heading_seqs = get_word_sequences(heading_parts)
    url_seqs = get_word_sequences(url_parts)

    for seq in heading_seqs:
        if seq in url_slug:
            print(f"Matched sequence from heading in URL: {seq}")
            return True

    for seq in url_seqs:
        if seq in heading_slug:
            print(f"Matched sequence from URL in heading: {seq}")
            return True

    return False


def is_product_detail_page(driver, url):
    print(f"Checking if URL is a product detail page: {url}")
    try:
        driver.get(url)
        time.sleep(2)
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        for heading in soup.find_all(['h1', 'h2']):
            classes = heading.get('class') or []
            if any(cls in ['product_title', 'product-title', 'fusion-title-heading'] for cls in classes):
                heading_text = heading.get_text(strip=True)
                if heading_text:
                    heading_slug = slugify(heading_text)
                    url_slug = slugify(urlparse(url).path.strip('/'))

                    print(f"Heading: {heading_text}")
                    print(f"Heading Slug: {heading_slug}")
                    print(f"URL Slug: {url_slug}")

                    if has_matching_sequence(heading_slug, url_slug):
                        print("Product detail page detected.")
                        return True

        print("Not a product detail page.")
        return False

    except Exception as e:
        print(f"Error checking product detail page: {e}")
        return False


def extract_dynamic_hrefs(driver, url):
    try:
        driver.get(url)
        time.sleep(3)  # Let JS render
        soup = BeautifulSoup(driver.page_source, 'html.parser')


        # ✅ Extract hrefs
        all_hrefs = [a.get('href') for a in soup.find_all('a') if a.get('href')]
        filtered_hrefs = [
            href for href in all_hrefs
            if href.startswith("http") or href.startswith("https") or href.startswith("/")
        ]
        return filtered_hrefs

    except Exception as e:
        print(f"Error extracting hrefs from {url}: {e}")
        return []


def save_url_to_json(output_file, current_url):
    urls = []

    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            try:
                urls = json.load(f)
            except json.JSONDecodeError:
                urls = []

    if current_url not in urls:
        urls.append(current_url)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(urls, f, ensure_ascii=False, indent=4)





from seleniumwire import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from dotenv import load_dotenv
import os

load_dotenv()


# Proxy details
proxy_host = os.getenv('PROXY_HOST')
proxy_port = os.getenv('PROXY_PORT')
proxy_protocol = os.getenv('PROXY_PROTOCOL')
proxy_user = os.getenv('PROXY_USER')
proxy_pass = os.getenv('PROXY_PASS')

# proxy_host = 'gate.decodo.com'
# proxy_port = '10001'
# proxy_protocol = 'https'
# proxy_user = 'spr4zziqlx'
# proxy_pass = '6r5kJnO4pDHc2jqc=h'



print("Proxy details:", proxy_host, proxy_port, proxy_protocol, proxy_user, proxy_pass)

# Selenium-wire proxy config
seleniumwire_options = {
    'proxy': {
        'http': f'{proxy_protocol}://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}',
        'https': f'{proxy_protocol}://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}',
        'no_proxy': 'localhost,127.0.0.1'
    }
}

def get_driver():
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument("--window-size=1920,1080")

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        seleniumwire_options=seleniumwire_options,
        options=chrome_options
    )
    return driver


def crawl_links_recursively(base_url, job_id=None):
    driver = get_driver()
    visited = set()
    to_visit = [base_url]
    domain = urlparse(base_url).netloc

    ignored_keywords = [
        'wp-content', 'wpcontent', 'blog', 'blogs', 'my-account', 'myaccount', 'account', 'user-account',
        'customer-account', 'order', 'terms-use', 'legal', 'policy', 'returns-and-exchange', 'returns-exchange',
        'returns', 'exchange', 'return-policy', 'refund-policy', 'refundpolicy', 'refunds', 'return',
        'exchange-policy', 'terms-and-condition', 'terms-condition', 'terms-and-conditions', 'terms-conditions',
        'terms', 'conditions', 'terms-of-service', 'payment-policy', 'paymentpolicy', 'payment', 'payment-methods',
        'payments', 'billing', 'order-cancellation-policy', 'cancellation-policy', 'cancel-policy',
        'order-cancellation', 'order-cancel', 'cancel-order', 'shipping-delivery', 'shipping', 'delivery',
        'shipping-policy', 'delivery-policy', 'shipping-information', 'delivery-information', 'privacy-policy',
        'privacy', 'privacy-statement', 'data-policy', 'cookie-policy', 'request-call-back', 'request-callback',
        'callback-request', 'call-back', 'callback', 'lost-password', 'forgot-password', 'password-recovery',
        'reset-password', 'recover-password', 'orders-tracking', 'order-tracking', 'track-order', 'track-orders',
        'tracking', 'cart', 'shopping-cart', 'checkout', 'check-out', 'checkout-page', 'contact-us', 'contact',
        'get-in-touch', 'reach-us', 'support', 'help-center', 'about-usa-leather-factory', 'about', 'about-us',
        'our-story', 'company-info', 'size-chart', 'sizing', 'size-guide', 'measurement-guide', 'faqs', 'faq',
        'frequently-asked-questions', 'help-faq', 'author', 'authors', 'fastest-service', 'fast-delivery',
        'quick-delivery', 'guaranteed-delivery',
    ]

    all_products_data = []

    # 🔁 Step 1: Crawl paginated /shop/page/{n}
    print("Starting paginated /shop/page crawl...")
    page = 1
    while True:
        try:
            if page == 1:
                paginated_url = urljoin(base_url, '/shop')
            else:
                paginated_url = urljoin(base_url, f'/shop/page/{page}')

            print(f"🧭 Crawling paginated shop page: {paginated_url}")
            scraper = ProductDataScraper()
            scraped_data = scraper.scrape_url(paginated_url)

            if scraped_data and "products" in scraped_data and scraped_data["products"]:
                print(f"✅ Scraped {len(scraped_data['products'])} products from {paginated_url}")
                save_single_url_data_to_db(job_id, scraped_data)

                # Add to recursive list
                to_visit.append(paginated_url)
                page += 1
            else:
                print(f"⛔ No products found at {paginated_url}. Ending pagination.")
                break
        except Exception as e:
            print(f"⚠️ Error crawling paginated page {paginated_url}: {e}")
            page += 1  # Try next page anyway in case it's a one-time error
        time.sleep(1)

    # 🔁 Step 2: Recursive Crawling
    print("Starting recursive link crawling...")
    try:
        while to_visit:
            current_url = to_visit.pop(0)
            if current_url in visited:
                continue

            print(f"🔎 Visiting: {current_url}")
            visited.add(current_url)

            parsed_url = urlparse(current_url)
            normalized_path = parsed_url.path.lower()

            is_valid = not any(part == keyword for part in normalized_path.split('/') for keyword in ignored_keywords)

            if is_valid:
                try:

                    print(f"🔍 Scraping products for: {current_url}")
                    scraper = ProductDataScraper()
                    scraped_data = scraper.scrape_url(current_url)

                    if scraped_data and "products" in scraped_data and scraped_data["products"]:
                        print(f"✅ Scraped {len(scraped_data['products'])} products from {current_url}")
                        save_single_url_data_to_db(job_id, scraped_data)
                        all_products_data.append(scraped_data)
                    else:
                        print(f"❌ No products found or invalid response at {current_url}")

                except Exception as e:
                    print(f"🚨 Error scraping {current_url}: {e}")

            # 🔗 Extract more links
            try:
                hrefs = extract_dynamic_hrefs(driver, current_url)
                for href in hrefs:
                    full_url = urljoin(current_url, href)
                    parsed_href_url = urlparse(full_url)
                    normalized_href_path = parsed_href_url.path.lower()
                    normalized_href_url = parsed_href_url.scheme + "://" + parsed_href_url.netloc + parsed_href_url.path

                    if (
                        parsed_href_url.netloc == domain and
                        'product/' not in normalized_href_path and
                        normalized_href_url not in visited and
                        normalized_href_url not in to_visit
                    ):
                        to_visit.append(normalized_href_url)
            except Exception as e:
                print(f"⚠️ Error extracting links from {current_url}: {e}")

            time.sleep(1)

    except Exception as e:
        print(f"🛑 Unexpected error in recursive crawling: {e}")
    finally:
        driver.quit()

    print(f"\n✅ Total URLs crawled: {len(visited)}")

