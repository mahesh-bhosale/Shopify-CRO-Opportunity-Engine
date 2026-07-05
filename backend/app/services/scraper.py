"""
Scraper service: fetches Shopify store pages (homepage, collection,
product pages, cart) and returns raw HTML per page label.
Every step has a fallback — nothing here should ever raise to the caller.
"""

import logging
import re
from urllib.parse import urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

# Collection slugs that are generic / not useful for CRO analysis
SKIP_COLLECTION_SLUGS = {
    "all",
    "frontpage",
    "featured",
    "home",
    "new",
    "new-arrivals",
    "sale",
    "clearance",
}

REQUEST_TIMEOUT = 14  # seconds


# ---------------------------------------------------------------------------
# ScraperService
# ---------------------------------------------------------------------------


class ScraperService:
    """
    Orchestrates fetching of all relevant pages for a single store URL.

    Usage:
        svc = ScraperService("https://allbirds.com")
        pages = svc.scrape_all()
        # pages = {
        #   "homepage":  {"url": "...", "html": "...", "status_code": 200},
        #   "collection": {...},
        #   "product_1":  {...},
        #   "product_2":  {...},
        #   "cart":       {...},
        # }
    """

    def __init__(self, base_url: str) -> None:
        self.base_url = self._normalize(base_url)
        self.session = requests.Session()
        self.session.headers.update(BROWSER_HEADERS)
        self.pages: dict[str, dict] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def scrape_all(self) -> dict[str, dict]:
        """
        Fetch homepage → collection → up to 2 product pages → cart.
        Returns whatever pages could be fetched; missing pages are simply
        absent from the dict (never raises).
        """
        # 1. Homepage
        homepage = self._fetch(self.base_url, "homepage")
        if not homepage:
            logger.warning("Could not fetch homepage for %s", self.base_url)
            return self.pages

        homepage_html = homepage["html"]

        # 2. Collection page
        collection_url = self._find_collection_url(homepage_html)
        collection_html = ""
        if collection_url:
            col = self._fetch(collection_url, "collection")
            collection_html = col["html"] if col else ""

        # 3. Product pages — gather candidates from both homepage + collection
        product_urls = self._find_product_urls(homepage_html)
        if collection_html:
            product_urls += self._find_product_urls(collection_html)

        # Deduplicate preserving order
        seen: set[str] = set()
        unique_products: list[str] = []
        for u in product_urls:
            if u not in seen:
                seen.add(u)
                unique_products.append(u)

        for idx, prod_url in enumerate(unique_products[:2], start=1):
            self._fetch(prod_url, f"product_{idx}")

        # 4. Cart page (Shopify renders cart HTML server-side; usually accessible)
        self._fetch(urljoin(self.base_url, "/cart"), "cart")

        logger.info(
            "Scraped %d pages for %s: %s",
            len(self.pages),
            self.base_url,
            list(self.pages.keys()),
        )
        return self.pages

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _fetch(self, url: str, label: str) -> dict | None:
        """
        GET a URL and store the result in self.pages[label].
        Returns the page dict on success, None on any failure.
        Never raises.
        """
        try:
            resp = self.session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
            # Accept 200 and also 304 (not modified)
            if resp.status_code not in (200, 304):
                logger.warning(
                    "Non-200 status %s for %s (%s)", resp.status_code, url, label
                )
                # Still store it — parser can decide what to do
            page = {
                "url": resp.url,  # final URL after any redirects
                "html": resp.text,
                "status_code": resp.status_code,
            }
            self.pages[label] = page
            logger.info("Fetched [%s] %s → %s", label, url, resp.status_code)
            return page
        except requests.exceptions.Timeout:
            logger.warning("Timeout fetching %s (%s)", url, label)
        except requests.exceptions.TooManyRedirects:
            logger.warning("Too many redirects for %s (%s)", url, label)
        except requests.exceptions.RequestException as exc:
            logger.warning("Request error fetching %s (%s): %s", url, label, exc)
        return None

    def _find_collection_url(self, html: str) -> str | None:
        """
        Find a useful collection URL from the homepage HTML.
        Tries several selector strategies in order, returning the first
        non-generic collection found.  Falls back to /collections/all.
        """
        soup = BeautifulSoup(html, "lxml")

        def _is_useful(href: str) -> bool:
            """Return True if the href points to a non-generic collection."""
            if not href or "/collections/" not in href:
                return False
            slug = href.rstrip("/").split("/collections/")[-1].split("?")[0].lower()
            return slug not in SKIP_COLLECTION_SLUGS

        # Strategy 1: nav / header links — most reliable on Shopify themes
        for selector in (
            "header nav a[href*='/collections/']",
            "nav a[href*='/collections/']",
            ".site-nav a[href*='/collections/']",
            ".main-menu a[href*='/collections/']",
        ):
            for tag in soup.select(selector):
                href = tag.get("href", "")
                if _is_useful(href):
                    return self._resolve(href)

        # Strategy 2: any anchor on the page
        for tag in soup.select("a[href*='/collections/']"):
            href = tag.get("href", "")
            if _is_useful(href):
                return self._resolve(href)

        # Fallback: /collections/all — always exists on Shopify
        fallback = urljoin(self.base_url, "/collections/all")
        logger.info("Using fallback collection URL: %s", fallback)
        return fallback

    def _find_product_urls(self, html: str) -> list[str]:
        """
        Extract up to 4 absolute product URLs from an HTML page.
        Filters out variant query-strings, .js files, and duplicate paths.
        """
        soup = BeautifulSoup(html, "lxml")
        urls: list[str] = []

        for tag in soup.select("a[href*='/products/']"):
            href = tag.get("href", "").strip()
            if not href:
                continue
            # Discard variant URLs (?variant=...) and JS endpoints
            if "?" in href or href.endswith(".js"):
                continue
            # Discard links that are just /products/ with no slug
            if re.match(r"^/?products/?$", href):
                continue
            absolute = self._resolve(href)
            if absolute:
                urls.append(absolute)
            if len(urls) >= 4:
                break

        return urls

    def _resolve(self, href: str) -> str:
        """
        Turn a relative or absolute href into a full URL using base_url.
        Returns empty string if resolution fails.
        """
        try:
            return urljoin(self.base_url, href)
        except Exception:
            return ""

    @staticmethod
    def _normalize(url: str) -> str:
        """
        Ensure the URL has an https scheme and no trailing slash.
        Raises ValueError for clearly invalid inputs.
        """
        url = url.strip().rstrip("/")
        parsed = urlparse(url)
        if not parsed.scheme:
            url = "https://" + url
            parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError(f"Unsupported URL scheme: {parsed.scheme}")
        # Force https for consistency
        normalized = urlunparse(parsed._replace(scheme="https"))
        return normalized


# ---------------------------------------------------------------------------
# Standalone helper (used by routers)
# ---------------------------------------------------------------------------


def scrape_store(url: str) -> dict[str, dict]:
    """
    Convenience wrapper.  Returns the pages dict directly.

    Example:
        pages = scrape_store("https://allbirds.com")
    """
    svc = ScraperService(url)
    return svc.scrape_all()