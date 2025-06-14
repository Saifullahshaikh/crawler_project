"""
This is a wrapper script that will call your existing crawler code.
You'll need to modify this to work with your specific implementation.
"""
import argparse
import json
import sys
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time

# Import your ProductDataScraper class
# from scrapper import ProductDataScraper

def crawl_website_for_categories(base_url, output_file):
    """Crawl a website for category links"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")  
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    
    # Use appropriate path for your environment
    service = Service('chromedriver')  # Remove .exe for non-Windows
    driver = webdriver.Chrome(service=service, options=chrome_options)

    visited_links = set()
    links_to_visit = [base_url]
    category_links = []

    try:
        while links_to_visit:
            current_url = links_to_visit.pop(0)
            if current_url in visited_links:
                continue

            visited_links.add(current_url)
            print(f"Visiting: {current_url}")

            try:
                driver.get(current_url)
                time.sleep(2) 
                page_source = driver.page_source  
            except Exception as e:
                print(f"Failed to load {current_url}: {e}")
                continue

            soup = BeautifulSoup(page_source, 'html.parser')

            links = soup.find_all('a', href=True)
            for link in links:
                href = urljoin(base_url, link['href'])
                if "category" in href and href not in visited_links:
                    category_links.append(href)
                    print(f"Found category link: {href}")
                    visited_links.add(href)  
            time.sleep(1)  

    finally:
        driver.quit()
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(category_links, f, ensure_ascii=False, indent=4)
    
    print(f"\nCategory links saved to {output_file}")
    return category_links

class DummyProductDataScraper:
    """Dummy class to simulate ProductDataScraper for testing"""
    def __init__(self, category_links_file):
        with open(category_links_file, 'r') as f:
            self.category_links = json.load(f)
        self.product_data = []
        
    def scrape_all_urls(self):
        """Simulate scraping product data from category links"""
        for url in self.category_links:
            # Simulate finding 2 products per category
            self.product_data.append({
                "title": f"Product from {url}",
                "price": "$99.99",
                "description": f"This is a product found on {url}",
                "url": f"{url}/product/123"
            })
            self.product_data.append({
                "title": f"Another product from {url}",
                "price": "$149.99",
                "description": f"This is another product found on {url}",
                "url": f"{url}/product/456"
            })
            
    def save_to_json(self, output_file):
        """Save product data to JSON file"""
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(self.product_data, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description='Web Crawler')
    parser.add_argument('--url', required=True, help='Website URL to crawl')
    parser.add_argument('--category-output', required=True, help='Output file for category links')
    parser.add_argument('--product-output', required=True, help='Output file for product data')
    
    args = parser.parse_args()
    
    try:
        # Step 1: Crawl for category links
        print(f"Starting to crawl {args.url} for category links...")
        category_links = crawl_website_for_categories(args.url, args.category_output)
        
        # Step 2: Scrape product data from category links
        print("Starting to scrape product data from category links...")
        
        # Use your actual ProductDataScraper class here
        # scraper = ProductDataScraper(args.category_output)
        
        # For testing, use the dummy scraper
        scraper = DummyProductDataScraper(args.category_output)
        
        scraper.scrape_all_urls()
        scraper.save_to_json(args.product_output)
        
        print(f"Crawling completed for {args.url}")
        print(f"Category links saved to {args.category_output}")
        print(f"Product data saved to {args.product_output}")
        sys.exit(0)
    
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
