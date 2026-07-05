import re
from typing import Optional


def validate_url(url: str) -> bool:
    pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return pattern.match(url) is not None


def generate_short_uuid() -> str:
    import uuid
    return str(uuid.uuid4())[:8]


def is_shopify_store(url: str) -> bool:
    shopify_indicators = ['.myshopify.com', 'shopify.com', 'cdn.shopify.com']
    return any(indicator in url.lower() for indicator in shopify_indicators)
