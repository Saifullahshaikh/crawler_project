from ninja import Schema
from typing import List, Optional

class CrawlRequest(Schema):
    urls: List[str]

class JobStatusResponse(Schema):
    id: str
    urls: List[str]
    status: str
    progress: int
    startedAt: str
    completedAt: Optional[str] = None
    categoryLinks: Optional[List[str]] = []
    productData: Optional[List[dict]] = []
    error: Optional[str] = None

class CategoriesResponse(Schema):
    categoryLinks: List[str]

class ProductsResponse(Schema):
    productData: List[dict]
