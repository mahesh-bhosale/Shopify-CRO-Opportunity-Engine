import httpx
from typing import List
from bs4 import BeautifulSoup


class Scraper:
    def __init__(self, max_pages: int = 4):
        self.max_pages = max_pages
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
    
    async def scrape_store(self, base_url: str) -> List[str]:
        pages = []
        try:
            response = await self.client.get(base_url)
            if response.status_code == 200:
                pages.append(base_url)
                soup = BeautifulSoup(response.text, 'lxml')
                
                links = soup.find_all('a', href=True)
                for link in links[:self.max_pages - 1]:
                    href = link['href']
                    if href.startswith('/'):
                        full_url = f"{base_url.rstrip('/')}{href}"
                        pages.append(full_url)
                    elif href.startswith('http'):
                        pages.append(href)
                    
                    if len(pages) >= self.max_pages:
                        break
        except Exception as e:
            print(f"Error scraping {base_url}: {e}")
        
        return pages
    
    async def close(self):
        await self.client.aclose()
