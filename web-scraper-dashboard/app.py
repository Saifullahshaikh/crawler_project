from flask import Flask, request, jsonify
from flask_cors import CORS
import importlib.util
import sys
import os
import time
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def import_python_file(file_path):
    """Dynamically import a Python file."""
    module_name = os.path.basename(file_path).replace('.py', '')
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module

@app.route('/api/scrape', methods=['POST'])
def scrape():
    data = request.json
    urls = data.get('urls', [])
    python_file = data.get('pythonFile', 'default_scraper.py')
    
    if not urls:
        return jsonify({"error": "No URLs provided"}), 400
    
    try:
        # Import the custom Python file
        custom_module = import_python_file(python_file)
        
        # Check if the module has a scrape_url function
        if not hasattr(custom_module, 'scrape_url'):
            return jsonify({"error": f"The file {python_file} does not have a scrape_url function"}), 400
        
        results = []
        for url in urls:
            try:
                # Call the scrape_url function with the URL
                result = custom_module.scrape_url(url)
                
                # If the result doesn't have the expected structure, add default fields
                if not isinstance(result, dict):
                    result = {"error": f"Invalid result format from {python_file}"}
                
                if "url" not in result:
                    result["url"] = url
                
                if "timestamp" not in result:
                    result["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                
                if "error" in result:
                    result["title"] = "Error: Failed to scrape"
                    result["description"] = result["error"]
                    result["data"] = {
                        "headings": [],
                        "links": [],
                        "images": [],
                        "text": "",
                        "metaTags": {}
                    }
                
                results.append(result)
                
                # Add a small delay between requests
                if len(urls) > 1:
                    time.sleep(0.5)
                    
            except Exception as e:
                results.append({
                    "url": url,
                    "title": "Error: Failed to scrape",
                    "description": str(e),
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "data": {
                        "headings": [],
                        "links": [],
                        "images": [],
                        "text": "",
                        "metaTags": {}
                    }
                })
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({"error": f"Error loading Python file: {str(e)}"}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if not file.filename.endswith('.py'):
        return jsonify({"error": "File must be a Python (.py) file"}), 400
    
    try:
        # Save the file
        file_path = os.path.join('uploads', file.filename)
        os.makedirs('uploads', exist_ok=True)
        file.save(file_path)
        
        return jsonify({
            "success": True,
            "message": f"File {file.filename} uploaded successfully",
            "filePath": file_path
        })
    except Exception as e:
        return jsonify({"error": f"Error uploading file: {str(e)}"}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    try:
        uploads_dir = 'uploads'
        os.makedirs(uploads_dir, exist_ok=True)
        files = [f for f in os.listdir(uploads_dir) if f.endswith('.py')]
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"error": f"Error listing files: {str(e)}"}), 500

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    os.makedirs('uploads', exist_ok=True)
    
    # Copy default_scraper.py to uploads if it doesn't exist
    default_scraper = 'uploads/default_scraper.py'
    if not os.path.exists(default_scraper):
        with open(default_scraper, 'w') as f:
            f.write('''
import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import urljoin, urlparse
import time

def scrape_url(url):
    """
    Scrape a URL and return structured data.
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
''')
    
    app.run(debug=True, port=5000)
