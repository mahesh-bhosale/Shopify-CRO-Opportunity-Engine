"""
Parser service: takes raw HTML from the scraper and extracts 30+ structured
CRO signals per page.  Every key is always present in the returned dict —
missing data becomes None, [], 0, or False — so downstream code never has
to guard against missing keys.

Design rules
------------
1. Always try multiple selectors in sequence (most-specific first).
2. Wrap every .get_text() / attribute access in a helper that catches
   AttributeError — soup.select_one() can return None.
3. Use re.search() on the full page text as a last-resort fallback for
   signals that don't have consistent CSS classes across Shopify themes.
4. Never raise — on any exception, log a warning and return the default.
"""

import logging
import re
from typing import Any

from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------


def _text(tag: Tag | None, default: str = "") -> str:
    """Safe .get_text(strip=True) — returns default if tag is None."""
    if tag is None:
        return default
    try:
        return tag.get_text(strip=True)
    except Exception:
        return default


def _attr(tag: Tag | None, attr: str, default: str = "") -> str:
    """Safe tag[attr] access — returns default if tag or attribute is missing."""
    if tag is None:
        return default
    try:
        return tag.get(attr, default) or default
    except Exception:
        return default


def _first_text(soup: BeautifulSoup, *selectors: str) -> str | None:
    """Try selectors in order; return stripped text of first match or None."""
    for sel in selectors:
        tag = soup.select_one(sel)
        if tag:
            t = _text(tag)
            if t:
                return t
    return None


def _count(soup: BeautifulSoup, selector: str) -> int:
    """Count elements matching selector, catching all errors."""
    try:
        return len(soup.select(selector))
    except Exception:
        return 0


def _has_text(soup: BeautifulSoup, *patterns: str) -> bool:
    """Return True if any pattern matches anywhere in the page text (case-insensitive)."""
    full_text = soup.get_text(" ", strip=True)
    for pat in patterns:
        if re.search(pat, full_text, re.I):
            return True
    return False


def _snippet(soup: BeautifulSoup, pattern: str, max_chars: int = 60) -> str | None:
    """
    Find the first occurrence of pattern in page text and return a short
    surrounding snippet (up to max_chars characters).
    """
    full_text = soup.get_text(" ", strip=True)
    m = re.search(rf".{{0,20}}{pattern}.{{0,{max_chars}}}", full_text, re.I)
    return m.group(0).strip() if m else None


# ---------------------------------------------------------------------------
# Per-page-type parsers
# ---------------------------------------------------------------------------


def _parse_product(soup: BeautifulSoup, url: str) -> dict[str, Any]:
    """Extract product-page CRO signals."""

    # --- Title ---
    product_title = _first_text(
        soup,
        "h1.product__title",
        "h1.product-single__title",
        "h1.product-title",
        "[itemprop='name']",
        "h1",
    )

    # --- Price ---
    price_tag = (
        soup.select_one("[itemprop='price']")
        or soup.select_one(".price__regular .price-item--regular")
        or soup.select_one(".product__price .price")
        or soup.select_one(".product-single__price")
        or soup.select_one(".price")
    )
    price = _text(price_tag) or None

    # --- Compare-at / was price (strikethrough) ---
    compare_tag = (
        soup.select_one(".price__compare .price-item--regular")
        or soup.select_one(".price--compare")
        or soup.select_one("s.price")
        or soup.select_one("[class*='compare']")
        or soup.select_one("del")
    )
    compare_at_price = _text(compare_tag) or None

    # --- Images ---
    gallery_imgs = (
        soup.select(".product__media img")
        or soup.select(".product-single__photo img")
        or soup.select(".product-images img")
        or soup.select("img[src*='/products/']")
    )
    image_urls = [
        _attr(img, "src") or _attr(img, "data-src")
        for img in gallery_imgs
        if (_attr(img, "src") or _attr(img, "data-src"))
    ][:3]
    images_count = len(gallery_imgs)

    # --- Video ---
    has_video = bool(
        soup.select_one("video")
        or soup.find("iframe", src=re.compile(r"youtube|vimeo", re.I))
    )

    # --- Reviews ---
    # Try structured data first, then text patterns
    review_count_tag = soup.select_one("[itemprop='reviewCount']")
    reviews_count = 0
    if review_count_tag:
        try:
            reviews_count = int(_text(review_count_tag).replace(",", ""))
        except ValueError:
            pass

    if reviews_count == 0:
        # Pattern: "1,234 reviews" or "47 ratings"
        m = re.search(r"([\d,]+)\s+(?:review|rating)", soup.get_text(), re.I)
        if m:
            try:
                reviews_count = int(m.group(1).replace(",", ""))
            except ValueError:
                pass

    # --- Rating ---
    rating_tag = soup.select_one("[itemprop='ratingValue']")
    reviews_rating: str | None = _text(rating_tag) or None
    if not reviews_rating:
        m = re.search(r"(\d+\.?\d*)\s*(?:out of\s*5|/\s*5|\*)", soup.get_text(), re.I)
        reviews_rating = m.group(1) if m else None

    has_review_section = bool(
        soup.select_one("[id*='review'], [class*='review'], [class*='spr']")
    )

    # --- CTA (Add to Cart) ---
    cta_tag = (
        soup.select_one("button[name='add']")
        or soup.select_one("[type='submit'][name='add']")
        or soup.find("button", string=re.compile(r"add to (cart|bag)|buy now", re.I))
    )
    # Fallback: any submit button inside a product form
    if not cta_tag:
        form = soup.select_one("form[action*='/cart/add']")
        if form:
            cta_tag = form.select_one("button[type='submit'], button")

    cta_text = _text(cta_tag) or None
    cta_present = cta_tag is not None

    # --- Quantity selector ---
    has_quantity_selector = bool(
        soup.select_one("input[name='quantity']")
        or soup.select_one("select[name='quantity']")
        or soup.select_one("[class*='quantity']")
    )

    # --- Variant options (size, colour, etc.) ---
    option_labels: list[str] = []
    for fieldset in soup.select("fieldset"):
        legend = fieldset.select_one("legend")
        if legend:
            option_labels.append(_text(legend))
    if not option_labels:
        for sel in soup.select("select[name*='option']"):
            label = _attr(sel, "aria-label") or _attr(sel, "id")
            if label:
                option_labels.append(label)
    size_color_options = option_labels

    # --- Shipping info ---
    shipping_info = _snippet(soup, r"free\s*shipping|shipping|delivery", max_chars=55)
    has_free_shipping_badge = bool(
        re.search(r"free\s*(shipping|delivery)", soup.get_text(), re.I)
    )

    # --- Return policy ---
    return_policy = _snippet(soup, r"return|refund|exchange", max_chars=55)

    # --- Trust badges ---
    trust_keywords = re.compile(
        r"secure|ssl|visa|mastercard|master card|paypal|amex|american express|"
        r"guaranteed|money.back|norton|mcafee|shopify\s*secure",
        re.I,
    )
    trust_badges: list[str] = []
    for img in soup.select("img"):
        alt = _attr(img, "alt")
        if alt and trust_keywords.search(alt):
            trust_badges.append(alt)
    # Also look for SVG titles and spans with trust keywords in text
    for el in soup.select("[class*='trust'], [class*='badge'], [class*='secure']"):
        t = _text(el)
        if t and trust_keywords.search(t):
            trust_badges.append(t)
    trust_badges = list(dict.fromkeys(trust_badges))  # deduplicate preserving order

    has_trust_section = bool(
        trust_badges
        or soup.select_one("[class*='trust'], [id*='trust'], [class*='secure']")
    )

    # --- FAQ ---
    faq_section = soup.select_one(
        "[class*='faq'], [id*='faq'], [class*='accordion'], [id*='accordion'], "
        "details, .collapsible"
    )
    faq_items = soup.select(
        "[class*='faq'] li, [class*='accordion'] [class*='item'], details"
    )
    faq_present = faq_section is not None or bool(faq_items)
    faq_items_count = len(faq_items)

    # --- Description length ---
    desc_tag = (
        soup.select_one("[itemprop='description']")
        or soup.select_one(".product__description")
        or soup.select_one(".product-single__description")
        or soup.select_one(".product-description")
        or soup.select_one(".rte")
    )
    description_length = len(_text(desc_tag)) if desc_tag else 0

    # --- Breadcrumbs ---
    breadcrumbs = [
        _text(a)
        for a in soup.select(
            "nav.breadcrumb a, [class*='breadcrumb'] a, [aria-label='breadcrumb'] a"
        )
        if _text(a)
    ]

    # --- Sticky ATC ---
    sticky_atc = bool(
        soup.select_one(
            "[class*='sticky'][class*='cart'], [class*='sticky'][class*='add'], "
            "[class*='sticky-atc'], [class*='fixed-atc']"
        )
    )

    # --- Social proof / cross-sell ---
    recently_viewed = _has_text(soup, r"recently viewed", r"you may also like")
    cross_sell_section = (
        soup.select_one("[class*='related'], [class*='upsell'], [class*='recommended']")
    )
    cross_sell_count = (
        _count(cross_sell_section, "a[href*='/products/']")
        if cross_sell_section
        else 0
    )

    return {
        "product_title": product_title,
        "price": price,
        "compare_at_price": compare_at_price,
        "images_count": images_count,
        "image_urls": image_urls,
        "has_video": has_video,
        "reviews_count": reviews_count,
        "reviews_rating": reviews_rating,
        "has_review_section": has_review_section,
        "cta_text": cta_text,
        "cta_present": cta_present,
        "has_quantity_selector": has_quantity_selector,
        "size_color_options": size_color_options,
        "shipping_info": shipping_info,
        "has_free_shipping_badge": has_free_shipping_badge,
        "return_policy": return_policy,
        "trust_badges": trust_badges,
        "has_trust_section": has_trust_section,
        "faq_present": faq_present,
        "faq_items_count": faq_items_count,
        "description_length": description_length,
        "breadcrumbs": breadcrumbs,
        "sticky_atc": sticky_atc,
        "recently_viewed": recently_viewed,
        "cross_sell_count": cross_sell_count,
    }


def _parse_collection(soup: BeautifulSoup, url: str) -> dict[str, Any]:
    """Extract collection-page CRO signals."""

    collection_title = _first_text(
        soup,
        "h1.collection__title",
        "h1.collection-hero__title",
        ".collection-header h1",
        "h1",
    )

    # Product card count — Shopify themes use different class names
    product_cards = (
        soup.select(".product-card")
        or soup.select("[data-product-card]")
        or soup.select(".grid__item .card")
        or soup.select("[class*='product-item']")
        or soup.select("li.grid__item")
    )
    product_count_visible = len(product_cards)

    has_filters = bool(
        soup.select_one(
            "[class*='filter'], [class*='facet'], "
            "[id*='filter'], form[id*='filter']"
        )
    )

    has_sorting = bool(
        soup.select_one("select[id*='sort'], select[name*='sort'], [class*='sort']")
        or _has_text(soup, r"sort by")
    )

    desc_tag = soup.select_one(
        ".collection__description, .collection-hero__description, "
        "[class*='collection-description']"
    )
    has_collection_description = desc_tag is not None
    collection_description_length = len(_text(desc_tag)) if desc_tag else 0

    # Count product cards that also have a visible price
    products_with_prices_visible = 0
    products_with_images = 0
    for card in product_cards:
        if card.select_one("[class*='price']"):
            products_with_prices_visible += 1
        if card.select_one("img"):
            products_with_images += 1

    return {
        "collection_title": collection_title,
        "product_count_visible": product_count_visible,
        "has_filters": has_filters,
        "has_sorting": has_sorting,
        "has_collection_description": has_collection_description,
        "collection_description_length": collection_description_length,
        "products_with_prices_visible": products_with_prices_visible,
        "products_with_images": products_with_images,
    }


def _parse_homepage(soup: BeautifulSoup, url: str) -> dict[str, Any]:
    """Extract homepage CRO signals."""

    has_announcement_bar = bool(
        soup.select_one(
            "[class*='announcement'], [class*='promo-bar'], "
            "[class*='top-bar'], [class*='marquee']"
        )
    )
    announcement_text: str | None = None
    if has_announcement_bar:
        bar = soup.select_one(
            "[class*='announcement'], [class*='promo-bar'], [class*='top-bar']"
        )
        announcement_text = _text(bar)[:120] if bar else None

    # Hero / banner section
    hero = soup.select_one(
        "[class*='hero'], [class*='banner'], [class*='slideshow'], "
        "[class*='slider'], section:first-of-type"
    )
    has_hero_section = hero is not None
    hero_headline: str | None = None
    hero_cta_text: str | None = None
    if hero:
        h_tag = hero.select_one("h1, h2")
        hero_headline = _text(h_tag) or None
        cta = hero.select_one("a.btn, a.button, button, a[class*='cta']")
        hero_cta_text = _text(cta) or None

    # Count featured collection sections
    featured_collection_count = len(
        soup.select(
            "[class*='featured-collection'], [class*='collection-list'], "
            "section[class*='collection']"
        )
    )

    return {
        "has_hero_section": has_hero_section,
        "hero_headline": hero_headline,
        "hero_cta_text": hero_cta_text,
        "featured_collection_count": featured_collection_count,
        "has_announcement_bar": has_announcement_bar,
        "announcement_text": announcement_text,
    }


def _parse_cart(soup: BeautifulSoup, url: str) -> dict[str, Any]:
    """Extract cart-page CRO signals."""

    page_text = soup.get_text(" ", strip=True)

    cart_is_empty = bool(
        re.search(r"your cart is empty|no items|cart is currently empty", page_text, re.I)
    )
    has_cart_upsell = bool(
        re.search(
            r"you might also like|add[- ]on|frequently bought|complete the look",
            page_text,
            re.I,
        )
    )
    has_order_note = bool(
        soup.select_one("textarea[name='note'], [class*='order-note'] textarea")
    )
    has_express_checkout = bool(
        re.search(r"buy with|shop pay|express checkout|fast checkout", page_text, re.I)
    )

    return {
        "cart_is_empty": cart_is_empty,
        "has_cart_upsell": has_cart_upsell,
        "has_order_note": has_order_note,
        "has_express_checkout": has_express_checkout,
    }


# ---------------------------------------------------------------------------
# Null / default dicts  (so every page type always has all keys)
# ---------------------------------------------------------------------------

_PRODUCT_DEFAULTS: dict[str, Any] = {
    "product_title": None,
    "price": None,
    "compare_at_price": None,
    "images_count": 0,
    "image_urls": [],
    "has_video": False,
    "reviews_count": 0,
    "reviews_rating": None,
    "has_review_section": False,
    "cta_text": None,
    "cta_present": False,
    "has_quantity_selector": False,
    "size_color_options": [],
    "shipping_info": None,
    "has_free_shipping_badge": False,
    "return_policy": None,
    "trust_badges": [],
    "has_trust_section": False,
    "faq_present": False,
    "faq_items_count": 0,
    "description_length": 0,
    "breadcrumbs": [],
    "sticky_atc": False,
    "recently_viewed": False,
    "cross_sell_count": 0,
}

_COLLECTION_DEFAULTS: dict[str, Any] = {
    "collection_title": None,
    "product_count_visible": 0,
    "has_filters": False,
    "has_sorting": False,
    "has_collection_description": False,
    "collection_description_length": 0,
    "products_with_prices_visible": 0,
    "products_with_images": 0,
}

_HOMEPAGE_DEFAULTS: dict[str, Any] = {
    "has_hero_section": False,
    "hero_headline": None,
    "hero_cta_text": None,
    "featured_collection_count": 0,
    "has_announcement_bar": False,
    "announcement_text": None,
}

_CART_DEFAULTS: dict[str, Any] = {
    "cart_is_empty": False,
    "has_cart_upsell": False,
    "has_order_note": False,
    "has_express_checkout": False,
}


# ---------------------------------------------------------------------------
# Public entry points
# ---------------------------------------------------------------------------


def parse_page(html: str, page_type: str, url: str) -> dict[str, Any]:
    """
    Parse one page's HTML into a structured CRO signal dict.

    The returned dict always contains:
      - page_type  : the label passed in (e.g. "product_1", "homepage")
      - url        : the page's URL
      - page_title : <title> tag text
      - h1         : first <h1> text
      - Plus all page-type-specific keys (see defaults above)

    All values are safe — no missing keys, no unhandled None access.
    """
    base: dict[str, Any] = {
        "page_type": page_type,
        "url": url,
        "page_title": None,
        "h1": None,
    }

    # Determine which type-specific defaults to start from
    if "product" in page_type:
        result = {**base, **_PRODUCT_DEFAULTS}
    elif "collection" in page_type:
        result = {**base, **_COLLECTION_DEFAULTS}
    elif "homepage" in page_type or "home" in page_type:
        result = {**base, **_HOMEPAGE_DEFAULTS}
    elif "cart" in page_type:
        result = {**base, **_CART_DEFAULTS}
    else:
        result = {**base}

    if not html or not html.strip():
        logger.warning("Empty HTML for page_type='%s', url='%s'", page_type, url)
        return result

    try:
        soup = BeautifulSoup(html, "lxml")

        # Universal fields
        result["page_title"] = _first_text(soup, "title")
        result["h1"] = _first_text(soup, "h1")

        # Type-specific parsing
        if "product" in page_type:
            result.update(_parse_product(soup, url))
        elif "collection" in page_type:
            result.update(_parse_collection(soup, url))
        elif "homepage" in page_type or "home" in page_type:
            result.update(_parse_homepage(soup, url))
        elif "cart" in page_type:
            result.update(_parse_cart(soup, url))

    except Exception as exc:
        logger.warning(
            "Unexpected error parsing page_type='%s' url='%s': %s",
            page_type,
            url,
            exc,
            exc_info=True,
        )

    return result


def parse_all_pages(pages: dict[str, dict]) -> list[dict[str, Any]]:
    """
    Parse every page returned by the scraper.

    Args:
        pages: dict mapping label → {url, html, status_code}
                as returned by ScraperService.scrape_all()

    Returns:
        List of parsed signal dicts, one per successfully fetched page.
        Pages with non-200 status codes are included but flagged.
    """
    parsed: list[dict[str, Any]] = []

    for label, page_data in pages.items():
        url = page_data.get("url", "")
        html = page_data.get("html", "")
        status = page_data.get("status_code", 0)

        logger.info("Parsing page [%s] %s (status=%s)", label, url, status)

        signals = parse_page(html, label, url)
        signals["http_status"] = status  # pass through for Gemini context
        parsed.append(signals)

    logger.info("Parsed %d pages total", len(parsed))
    return parsed