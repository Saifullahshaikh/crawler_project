import requests
from bs4 import BeautifulSoup

def get_jackfit_product_details():
    url = "https://www.jackfitleathers.com/category/womens-jackets/"
    
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        )
    }

    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print("Failed to retrieve the website.")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    product_list = []

    product_items = soup.select("li.product-grid-view.product")
    for item in product_items:
        product = {}

        # Product URL
        a_tag = item.find("a", href=True)
        product['product_url'] = a_tag['href'] if a_tag else None

        # Product name
        product['name'] = a_tag['title'] if a_tag and a_tag.has_attr('title') else None

        # Image URL
        img_tag = item.find("img")
        product['image_url'] = img_tag['src'] if img_tag and img_tag.has_attr('src') else None

        # Price
        price_tag = item.find("span", class_="price")
        if not price_tag:
            price_tag = item.find("span", class_="woocommerce-Price-amount")
        product['price'] = price_tag.get_text(strip=True) if price_tag else None

        product_list.append(product)

    return [{
        "url": url,
        "products": product_list
    }]


detail = get_jackfit_product_details()
print(detail)