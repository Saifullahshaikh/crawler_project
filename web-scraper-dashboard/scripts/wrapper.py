import sys
import json
import importlib.util
import os

def import_python_file(file_path):
    """Dynamically import a Python file."""
    module_name = os.path.basename(file_path).replace('.py', '')
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Usage: python wrapper.py <python_file> <url>"}))
        return
    
    python_file = sys.argv[1]
    url = sys.argv[2]
    
    try:
        # Import the custom Python file
        custom_module = import_python_file(python_file)
        
        # Check if the module has a scrape_url function
        if hasattr(custom_module, 'scrape_url'):
            # Call the scrape_url function with the URL
            result = custom_module.scrape_url(url)
            
            # If the result is not already JSON, convert it
            if not isinstance(result, str):
                result = json.dumps(result)
                
            print(result)
        else:
            print(json.dumps({"error": f"The file {python_file} does not have a scrape_url function"}))
    
    except Exception as e:
        print(json.dumps({"error": f"Error executing {python_file}: {str(e)}"}))

if __name__ == "__main__":
    main()
