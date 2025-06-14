import time
import re
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options


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
            if any(cls in ['product_title', 'product-title'] for cls in classes):
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


# ---------- TEST SECTION ----------
if __name__ == "__main__":
    test_url = "https://www.primejackets.com/cafe-racer-jacket"  # Change to test others

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    driver_path = 'C:/Users/Connect2Aryans/Desktop/WEb scrapper/webscrapper/app/chromedriver.exe'
    driver = webdriver.Chrome(service=Service(driver_path), options=options)

    try:
        result = is_product_detail_page(driver, test_url)
        print(f"\nResult: {result}")
    finally:
        driver.quit()
