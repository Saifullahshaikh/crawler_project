from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os
import uuid
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store job status in memory (in a real app, use a database)
jobs = {}

def run_crawler(job_id, urls):
    """Run the crawler in a separate thread for multiple URLs"""
    try:
        # Update job status
        jobs[job_id]["status"] = "running"
        
        # Create a temporary directory for this job
        job_dir = f"jobs/{job_id}"
        os.makedirs(job_dir, exist_ok=True)
        
        all_category_links = []
        all_product_data = []
        
        # Process each URL
        for i, url in enumerate(urls):
            try:
                # Run the crawler script for this URL
                category_output = f"{job_dir}/category_links_{i}.json"
                product_output = f"{job_dir}/product_data_{i}.json"
                
                # This command will need to be adjusted based on your actual script
                command = [
                    "python", 
                    "crawler.py",  # Your main script
                    "--url", url,
                    "--category-output", category_output,
                    "--product-output", product_output
                ]
                
                process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                stdout, stderr = process.communicate()
                
                if process.returncode != 0:
                    print(f"Error processing URL {url}: {stderr}")
                    continue
                
                # Read the results for this URL
                try:
                    with open(category_output, 'r') as f:
                        category_links = json.load(f)
                        all_category_links.extend(category_links)
                    
                    with open(product_output, 'r') as f:
                        product_data = json.load(f)
                        all_product_data.extend(product_data)
                        
                except Exception as e:
                    print(f"Error reading results for URL {url}: {str(e)}")
                    
            except Exception as e:
                print(f"Error processing URL {url}: {str(e)}")
                
            # Update progress
            jobs[job_id]["progress"] = int((i + 1) / len(urls) * 100)
        
        # Save combined results
        combined_category_output = f"{job_dir}/all_category_links.json"
        combined_product_output = f"{job_dir}/all_product_data.json"
        
        with open(combined_category_output, 'w') as f:
            json.dump(all_category_links, f, indent=2)
            
        with open(combined_product_output, 'w') as f:
            json.dump(all_product_data, f, indent=2)
        
        # Update job with results
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["completedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        jobs[job_id]["results"] = {
            "categoryLinks": all_category_links,
            "productData": all_product_data
        }
    
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)

@app.route('/api/crawl', methods=['POST'])
def start_crawl():
    data = request.json
    urls = data.get('urls', [])
    
    if not urls or not isinstance(urls, list) or len(urls) == 0:
        return jsonify({"error": "At least one URL is required"}), 400
    
    # Create a new job
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "id": job_id,
        "urls": urls,
        "status": "pending",
        "progress": 0,
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    # Start the crawler in a separate thread
    thread = threading.Thread(target=run_crawler, args=(job_id, urls))
    thread.start()
    
    return jsonify({
        "status": "success",
        "message": f"Crawling started for {len(urls)} URL(s)",
        "jobId": job_id
    })

@app.route('/api/crawl/status', methods=['GET'])
def get_job_status():
    job_id = request.args.get('jobId')
    
    if not job_id or job_id not in jobs:
        return jsonify({"error": "Invalid job ID"}), 400
    
    job = jobs[job_id]
    
    response = {
        "id": job["id"],
        "urls": job["urls"],
        "status": job["status"],
        "progress": job["progress"],
        "startedAt": job["startedAt"]
    }
    
    if job["status"] == "completed":
        response["completedAt"] = job["completedAt"]
        response["categoryLinks"] = job["results"]["categoryLinks"]
        response["productData"] = job["results"]["productData"]
    
    if job["status"] == "failed":
        response["error"] = job["error"]
    
    return jsonify(response)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    # In a real app, you would get the latest category links
    # For now, we'll return data from the most recent completed job
    completed_jobs = [job for job in jobs.values() if job["status"] == "completed"]
    
    if not completed_jobs:
        return jsonify({"categoryLinks": []})
    
    # Get the most recent completed job
    latest_job = max(completed_jobs, key=lambda x: x["completedAt"])
    
    return jsonify({
        "categoryLinks": latest_job["results"]["categoryLinks"]
    })

@app.route('/api/products', methods=['GET'])
def get_products():
    # In a real app, you would get the latest product data
    # For now, we'll return data from the most recent completed job
    completed_jobs = [job for job in jobs.values() if job["status"] == "completed"]
    
    if not completed_jobs:
        return jsonify({"productData": []})
    
    # Get the most recent completed job
    latest_job = max(completed_jobs, key=lambda x: x["completedAt"])
    
    return jsonify({
        "productData": latest_job["results"]["productData"]
    })

if __name__ == '__main__':
    # Create jobs directory if it doesn't exist
    os.makedirs("jobs", exist_ok=True)
    app.run(debug=True, port=5000)
