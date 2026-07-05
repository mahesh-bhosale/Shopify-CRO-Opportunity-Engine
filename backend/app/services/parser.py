from bs4 import BeautifulSoup
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, HttpUrl
from urllib.parse import urljoin


class HomepageData(BaseModel):
    url: str
    store_title: str
    meta_description: str
    hero_headline: Optional[str]
    navigation_items: List[str]
    announcement_bar: Optional[str]
    trust_badges: List[str]


class ProductPageData(BaseModel):
    url: str
    title: str
    price: Optional[str]
    compare_at_price: Optional[str]
    images: List[str]
    has_add_to_cart_button: bool
    has_reviews: bool
    shipping_information: Optional[str]
    return_policy: Optional[str]
    faqs: List[str]
    stock_availability: Optional[str]
    product_description: Optional[str]


class CollectionPageData(BaseModel):
    url: str
    collection_title: str
    number_of_products: int


class CartPageData(BaseModel):
    url: str
    has_shipping_estimate: bool
    payment_icons: List[str]
    trust_badges: List[str]
    has_checkout_button: bool


class ParsedStore(BaseModel):
    homepage: Optional[HomepageData]
    product_pages: List[ProductPageData]
    collection_pages: List[CollectionPageData]
    cart_page: Optional[CartPageData]


class Parser:
    def __init__(self):
        pass
    
    def parse_pages(self, pages: List[Dict[str, Any]]) -> ParsedStore:
        homepage = None
        product_pages = []
        collection_pages = []
        cart_page = None
        
        for page in pages:
            url = page.get("url", "")
            html = page.get("html", "")
            
            if not html:
                continue
            
            soup = BeautifulSoup(html, 'lxml')
            
            if "/products/" in url:
                product_data = self._parse_product_page(soup, url)
                if product_data:
                    product_pages.append(product_data)
            elif "/collections/" in url:
                collection_data = self._parse_collection_page(soup, url)
                if collection_data:
                    collection_pages.append(collection_data)
            elif "/cart" in url or "/checkout" in url:
                cart_data = self._parse_cart_page(soup, url)
                if cart_data:
                    cart_page = cart_data
            else:
                homepage_data = self._parse_homepage(soup, url)
                if homepage_data:
                    homepage = homepage_data
        
        return ParsedStore(
            homepage=homepage,
            product_pages=product_pages,
            collection_pages=collection_pages,
            cart_page=cart_page
        )
    
    def _parse_homepage(self, soup: BeautifulSoup, url: str) -> Optional[HomepageData]:
        store_title = self._extract_store_title(soup)
        meta_description = self._extract_meta_description(soup)
        hero_headline = self._extract_hero_headline(soup)
        navigation_items = self._extract_navigation(soup)
        announcement_bar = self._extract_announcement_bar(soup)
        trust_badges = self._extract_trust_badges(soup)
        
        return HomepageData(
            url=url,
            store_title=store_title,
            meta_description=meta_description,
            hero_headline=hero_headline,
            navigation_items=navigation_items,
            announcement_bar=announcement_bar,
            trust_badges=trust_badges
        )
    
    def _parse_product_page(self, soup: BeautifulSoup, url: str) -> Optional[ProductPageData]:
        title = self._extract_product_title(soup)
        price = self._extract_price(soup)
        compare_at_price = self._extract_compare_at_price(soup)
        images = self._extract_product_images(soup, url)
        has_add_to_cart_button = self._has_add_to_cart_button(soup)
        has_reviews = self._has_product_reviews(soup)
        shipping_information = self._extract_shipping_information(soup)
        return_policy = self._extract_return_policy(soup)
        faqs = self._extract_faqs(soup)
        stock_availability = self._extract_stock_availability(soup)
        product_description = self._extract_product_description(soup)
        
        return ProductPageData(
            url=url,
            title=title,
            price=price,
            compare_at_price=compare_at_price,
            images=images,
            has_add_to_cart_button=has_add_to_cart_button,
            has_reviews=has_reviews,
            shipping_information=shipping_information,
            return_policy=return_policy,
            faqs=faqs,
            stock_availability=stock_availability,
            product_description=product_description
        )
    
    def _parse_collection_page(self, soup: BeautifulSoup, url: str) -> Optional[CollectionPageData]:
        collection_title = self._extract_collection_title(soup)
        number_of_products = self._count_products_in_collection(soup)
        
        return CollectionPageData(
            url=url,
            collection_title=collection_title,
            number_of_products=number_of_products
        )
    
    def _parse_cart_page(self, soup: BeautifulSoup, url: str) -> Optional[CartPageData]:
        has_shipping_estimate = self._has_shipping_estimate(soup)
        payment_icons = self._extract_payment_icons(soup)
        trust_badges = self._extract_trust_badges(soup)
        has_checkout_button = self._has_checkout_button(soup)
        
        return CartPageData(
            url=url,
            has_shipping_estimate=has_shipping_estimate,
            payment_icons=payment_icons,
            trust_badges=trust_badges,
            has_checkout_button=has_checkout_button
        )
    
    def _extract_store_title(self, soup: BeautifulSoup) -> str:
        if soup.title:
            return soup.title.string.strip() if soup.title.string else ""
        
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            return og_title['content'].strip()
        
        h1 = soup.find('h1')
        if h1:
            return h1.get_text().strip()
        
        return ""
    
    def _extract_meta_description(self, soup: BeautifulSoup) -> str:
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            return meta['content'].strip()
        
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content'):
            return og_desc['content'].strip()
        
        return ""
    
    def _extract_hero_headline(self, soup: BeautifulSoup) -> Optional[str]:
        hero_selectors = [
            '.hero h1',
            '.hero-title',
            '.banner h1',
            '[class*="hero"] h1',
            'h1.hero'
        ]
        
        for selector in hero_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return None
    
    def _extract_navigation(self, soup: BeautifulSoup) -> List[str]:
        nav_items = []
        
        nav = soup.find('nav')
        if nav:
            links = nav.find_all('a', href=True)
            nav_items = [link.get_text().strip() for link in links if link.get_text().strip()]
        
        return nav_items
    
    def _extract_announcement_bar(self, soup: BeautifulSoup) -> Optional[str]:
        announcement_selectors = [
            '.announcement-bar',
            '[class*="announcement"]',
            '.promo-bar',
            '.top-bar'
        ]
        
        for selector in announcement_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return None
    
    def _extract_trust_badges(self, soup: BeautifulSoup) -> List[str]:
        badges = []
        
        trust_keywords = ['secure', 'ssl', 'guarantee', 'verified', 'badge', 'trust', 'payment']
        text = soup.get_text().lower()
        
        for keyword in trust_keywords:
            if keyword in text:
                badges.append(keyword)
        
        payment_icons = soup.find_all('img', alt=True)
        for img in payment_icons:
            alt = img['alt'].lower()
            if any(payment in alt for payment in ['visa', 'mastercard', 'amex', 'paypal', 'stripe']):
                badges.append(img['alt'])
        
        return badges
    
    def _extract_product_title(self, soup: BeautifulSoup) -> str:
        selectors = [
            'h1.product-title',
            '.product-single h1',
            '[class*="product"] h1',
            'h1'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return ""
    
    def _extract_price(self, soup: BeautifulSoup) -> Optional[str]:
        price_selectors = [
            '.price',
            '.product-price',
            '[class*="price"]',
            '.money'
        ]
        
        for selector in price_selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text().strip()
                if any(char.isdigit() for char in text):
                    return text
        
        return None
    
    def _extract_compare_at_price(self, soup: BeautifulSoup) -> Optional[str]:
        compare_selectors = [
            '.compare-at-price',
            '[class*="compare"]',
            '.was-price',
            '.original-price'
        ]
        
        for selector in compare_selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text().strip()
                if any(char.isdigit() for char in text):
                    return text
        
        return None
    
    def _extract_product_images(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        images = []
        
        img_selectors = [
            '.product-image img',
            '.product-single img',
            '[class*="product"] img',
            'img[src*="product"]'
        ]
        
        for selector in img_selectors:
            for img in soup.select(selector):
                src = img.get('src') or img.get('data-src')
                if src:
                    full_url = urljoin(base_url, src)
                    if full_url not in images:
                        images.append(full_url)
        
        return images[:10]
    
    def _has_add_to_cart_button(self, soup: BeautifulSoup) -> bool:
        button_selectors = [
            'button[type="submit"]',
            '.add-to-cart',
            '[class*="add"]',
            'button:contains("Add")',
            'button:contains("Cart")'
        ]
        
        for selector in button_selectors:
            elements = soup.select(selector)
            for element in elements:
                text = element.get_text().lower()
                if 'add' in text or 'cart' in text or 'buy' in text:
                    return True
        
        return False
    
    def _has_product_reviews(self, soup: BeautifulSoup) -> bool:
        review_keywords = ['review', 'rating', 'star', 'testimonial', 'yotpo', 'judge.me']
        text = soup.get_text().lower()
        return any(keyword in text for keyword in review_keywords)
    
    def _extract_shipping_information(self, soup: BeautifulSoup) -> Optional[str]:
        shipping_selectors = [
            '.shipping-info',
            '[class*="shipping"]',
            '.delivery-info'
        ]
        
        for selector in shipping_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return None
    
    def _extract_return_policy(self, soup: BeautifulSoup) -> Optional[str]:
        return_selectors = [
            '.return-policy',
            '[class*="return"]',
            '.refund-policy'
        ]
        
        for selector in return_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return None
    
    def _extract_faqs(self, soup: BeautifulSoup) -> List[str]:
        faqs = []
        
        faq_selectors = [
            '.faq',
            '[class*="faq"]',
            '.accordion',
            '.question'
        ]
        
        for selector in faq_selectors:
            elements = soup.select(selector)
            for element in elements:
                text = element.get_text().strip()
                if text and len(text) > 10:
                    faqs.append(text)
        
        return faqs[:5]
    
    def _extract_stock_availability(self, soup: BeautifulSoup) -> Optional[str]:
        stock_selectors = [
            '.stock',
            '[class*="stock"]',
            '.availability',
            '.inventory'
        ]
        
        for selector in stock_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return None
    
    def _extract_product_description(self, soup: BeautifulSoup) -> Optional[str]:
        desc_selectors = [
            '.product-description',
            '[class*="description"]',
            '.product-details'
        ]
        
        for selector in desc_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()[:500]
        
        return None
    
    def _extract_collection_title(self, soup: BeautifulSoup) -> str:
        selectors = [
            'h1.collection-title',
            '.collection h1',
            'h1'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return ""
    
    def _count_products_in_collection(self, soup: BeautifulSoup) -> int:
        product_selectors = [
            '.product-item',
            '.product-card',
            '[class*="product"]'
        ]
        
        for selector in product_selectors:
            elements = soup.select(selector)
            if elements:
                return len(elements)
        
        return 0
    
    def _has_shipping_estimate(self, soup: BeautifulSoup) -> bool:
        shipping_keywords = ['shipping', 'delivery', 'estimate', 'calculator']
        text = soup.get_text().lower()
        return any(keyword in text for keyword in shipping_keywords)
    
    def _extract_payment_icons(self, soup: BeautifulSoup) -> List[str]:
        icons = []
        
        payment_keywords = ['visa', 'mastercard', 'amex', 'paypal', 'stripe', 'apple pay']
        
        for img in soup.find_all('img'):
            alt = img.get('alt', '').lower()
            src = img.get('src', '').lower()
            
            for keyword in payment_keywords:
                if keyword in alt or keyword in src:
                    icons.append(keyword)
        
        return list(set(icons))
    
    def _has_checkout_button(self, soup: BeautifulSoup) -> bool:
        checkout_selectors = [
            'button:contains("Checkout")',
            'button:contains("checkout")',
            '.checkout-button',
            '[class*="checkout"]'
        ]
        
        for selector in checkout_selectors:
            elements = soup.select(selector)
            if elements:
                return True
        
        text = soup.get_text().lower()
        return 'checkout' in text
