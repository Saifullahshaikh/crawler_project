import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import urljoin, urlparse
import time

def scrape_url(url):
    """
    Scrape a URL and return structured data.
    
    This function should return a dictionary with the following structure:
    {
        "url": "https://example.com",
        "title": "Page Title",
        "description": "Page Description",
        "timestamp": "2023-05-04T14:07:47.000Z",
        "data": {
            "headings": ["Heading 1", "Heading 2"],
            "links": ["https://example.com/page1", "https://example.com/page2"],
            "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
            "text": "Page text content...",
            "metaTags": {"og:title": "Title", "og:description": "Description"}
        }
    }
    """
    try:
        # Add scheme if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        # Validate URL
        parsed_url = urlparse(url)
        if not parsed_url.netloc:
            return {
                "error": f"Invalid URL: {url}"
            }
            
        # Send request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract data
        title = soup.title.text.strip() if soup.title else "No title found"
        
        # Extract meta description
        description = ""
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            description = meta_desc.get('content')
        else:
            og_desc = soup.find('meta', attrs={'property': 'og:description'})
            if og_desc and og_desc.get('content'):
                description = og_desc.get('content')
            else:
                description = "No description found"
        
        # Extract headings
        headings = []
        for heading in soup.find_all(['h1', 'h2', 'h3']):
            text = heading.get_text().strip()
            if text:
                headings.append(text)
        
        # Extract links
        links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href and not href.startswith(('javascript:', '#')):
                try:
                    absolute_url = urljoin(url, href)
                    links.append(absolute_url)
                except:
                    pass
        
        # Extract images
        images = []
        for img in soup.find_all('img', src=True):
            src = img['src']
            if src:
                try:
                    absolute_src = urljoin(url, src)
                    images.append(absolute_src)
                except:
                    pass
        
        # Extract text content
        text = soup.body.get_text(" ", strip=True) if soup.body else ""
        text = ' '.join(text.split())
        
        # Extract meta tags
        meta_tags = {}
        for meta in soup.find_all('meta'):
            name = meta.get('name') or meta.get('property')
            content = meta.get('content')
            if name and content:
                meta_tags[name] = content
        
        # Prepare result
        result = {
            "url": url,
            "title": title,
            "description": description,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "data": {
                "headings": headings[:20],  # Limit to 20 headings
                "links": list(set(links))[:50],  # Remove duplicates and limit to 50 links
                "images": list(set(images))[:20],  # Remove duplicates and limit to 20 images
                "text": text[:1000],  # Limit text to 1000 characters
                "metaTags": meta_tags
            }
        }
        
        return result
        
    except Exception as e:
        return {
            "error": f"Failed to scrape {url}: {str(e)}"
        }

# This allows the script to be run directly for testing
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        url = sys.argv[1]
        result = scrape_url(url)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No URL provided"}))
