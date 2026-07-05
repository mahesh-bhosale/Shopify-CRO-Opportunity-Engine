import requests
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from app.config import settings


class ScrapedPage:
    def __init__(self, url: str, html: str, status_code: int):
        self.url = url
        self.html = html
        self.status_code = status_code
    
    def to_dict(self) -> Dict[str, any]:
        return {
            "url": self.url,
            "html": self.html,
            "status_code": self.status_code
        }


class Scraper:
    def __init__(self, max_pages: Optional[int] = None):
        self.max_pages = max_pages or settings.MAX_PAGES_TO_SCRAPE
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        })
    
    def validate_url(self, url: str) -> bool:
        try:
            result = urlparse(url)
            return all([result.scheme in ['http', 'https'], result.netloc])
        except Exception:
            return False
    
    def is_shopify_store(self, html: str, url: str) -> bool:
        shopify_indicators = [
            'myshopify.com',
            'cdn.shopify.com',
            'shopify.com',
            'Shopify.theme',
            'Shopify.checkout',
            'shopify-section'
        ]
        
        url_lower = url.lower()
        html_lower = html.lower()
        
        if any(indicator in url_lower for indicator in shopify_indicators):
            return True
        
        return any(indicator in html_lower for indicator in shopify_indicators)
    
    def fetch_page(self, url: str, timeout: int = 30) -> Optional[ScrapedPage]:
        try:
            response = self.session.get(
                url,
                timeout=timeout,
                allow_redirects=True,
                verify=True
            )
            
            if response.status_code == 200:
                return ScrapedPage(
                    url=response.url,
                    html=response.text,
                    status_code=response.status_code
                )
            elif response.status_code == 404:
                print(f"Page not found: {url}")
                return None
            else:
                print(f"Unexpected status code {response.status_code} for {url}")
                return ScrapedPage(
                    url=response.url,
                    html=response.text,
                    status_code=response.status_code
                )
                
        except requests.exceptions.Timeout:
            print(f"Timeout while fetching {url}")
            return None
        except requests.exceptions.SSLError as e:
            print(f"SSL error while fetching {url}: {e}")
            return None
        except requests.exceptions.ConnectionError as e:
            print(f"Connection error while fetching {url}: {e}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Request error while fetching {url}: {e}")
            return None
    
    def discover_product_pages(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        product_urls = set()
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(base_url, href)
            
            if '/products/' in full_url:
                product_urls.add(full_url)
        
        return list(product_urls)
    
    def discover_collection_pages(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        collection_urls = set()
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(base_url, href)
            
            if '/collections/' in full_url:
                collection_urls.add(full_url)
        
        return list(collection_urls)
    
    def discover_cart_page(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        for link in soup.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(base_url, href)
            
            if '/cart' in full_url or '/checkout' in full_url:
                return full_url
        
        return urljoin(base_url, '/cart')
    
    def scrape_store(self, url: str) -> Dict[str, any]:
        if not self.validate_url(url):
            return {
                "success": False,
                "error": "Invalid URL format",
                "pages": []
            }
        
        pages = []
        scraped_urls = set()
        
        homepage = self.fetch_page(url)
        if not homepage:
            return {
                "success": False,
                "error": "Failed to fetch homepage",
                "pages": []
            }
        
        if not self.is_shopify_store(homepage.html, url):
            return {
                "success": False,
                "error": "Not detected as a Shopify store",
                "pages": []
            }
        
        pages.append(homepage.to_dict())
        scraped_urls.add(homepage.url)
        
        if len(pages) >= self.max_pages:
            return {
                "success": True,
                "is_shopify": True,
                "pages": pages
            }
        
        soup = BeautifulSoup(homepage.html, 'lxml')
        
        product_urls = self.discover_product_pages(soup, url)
        collection_urls = self.discover_collection_pages(soup, url)
        cart_url = self.discover_cart_page(soup, url)
        
        priority_urls = []
        priority_urls.extend(product_urls[:2])
        priority_urls.extend(collection_urls[:1])
        if cart_url:
            priority_urls.append(cart_url)
        
        for page_url in priority_urls:
            if len(pages) >= self.max_pages:
                break
            
            if page_url in scraped_urls:
                continue
            
            page = self.fetch_page(page_url)
            if page:
                pages.append(page.to_dict())
                scraped_urls.add(page.url)
        
        return {
            "success": True,
            "is_shopify": True,
            "pages": pages
        }
    
    def close(self):
        self.session.close()
