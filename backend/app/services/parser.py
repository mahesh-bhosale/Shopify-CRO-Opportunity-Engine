from bs4 import BeautifulSoup
from typing import Dict, Any


class Parser:
    def parse_page(self, html: str, url: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html, 'lxml')
        
        data = {
            "url": url,
            "title": soup.title.string if soup.title else "",
            "meta_description": self._get_meta_description(soup),
            "has_reviews": self._has_reviews(soup),
            "has_trust_badges": self._has_trust_badges(soup),
            "has_product_images": self._has_product_images(soup),
            "checkout_flow": self._analyze_checkout(soup),
            "cart_elements": self._analyze_cart(soup)
        }
        
        return data
    
    def _get_meta_description(self, soup: BeautifulSoup) -> str:
        meta = soup.find('meta', attrs={'name': 'description'})
        return meta['content'] if meta else ""
    
    def _has_reviews(self, soup: BeautifulSoup) -> bool:
        review_keywords = ['review', 'rating', 'star', 'testimonial']
        text = soup.get_text().lower()
        return any(keyword in text for keyword in review_keywords)
    
    def _has_trust_badges(self, soup: BeautifulSoup) -> bool:
        trust_keywords = ['secure', 'ssl', 'guarantee', 'verified', 'badge']
        text = soup.get_text().lower()
        return any(keyword in text for keyword in trust_keywords)
    
    def _has_product_images(self, soup: BeautifulSoup) -> bool:
        images = soup.find_all('img')
        return len(images) > 0
    
    def _analyze_checkout(self, soup: BeautifulSoup) -> str:
        checkout_keywords = ['checkout', 'cart', 'buy now', 'purchase']
        text = soup.get_text().lower()
        found = [kw for kw in checkout_keywords if kw in text]
        return ", ".join(found) if found else "none"
    
    def _analyze_cart(self, soup: BeautifulSoup) -> str:
        cart_keywords = ['add to cart', 'cart', 'basket', 'bag']
        text = soup.get_text().lower()
        found = [kw for kw in cart_keywords if kw in text]
        return ", ".join(found) if found else "none"
