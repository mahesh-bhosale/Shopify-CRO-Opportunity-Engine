from app.services.parser import parse_page

def test_parse_product_page():
    html = """
    <html>
        <head><title>Mock Running Shoe</title></head>
        <body>
            <h1 class="product__title">Mock Running Shoe</h1>
            <span itemprop="price">$95.00</span>
            <div class="product__media">
                <img src="img1.jpg" />
                <img src="img2.jpg" />
            </div>
            <button name="add">Add to Cart</button>
            <div class="spr-reviews">Active reviews section</div>
            <div class="faq-accordion">FAQ details here</div>
        </body>
    </html>
    """
    signals = parse_page(html, "product_1", "https://mockstore.com/products/shoe")
    
    assert signals["page_type"] == "product_1"
    assert signals["product_title"] == "Mock Running Shoe"
    assert signals["price"] == "$95.00"
    assert signals["images_count"] == 2
    assert signals["cta_present"] is True
    assert signals["has_review_section"] is True
    assert signals["faq_present"] is True

def test_parse_collection_page():
    html = """
    <html>
        <head><title>Fall Collection</title></head>
        <body>
            <h1>Fall Collection</h1>
            <div class="product-card">Card 1</div>
            <div class="product-card">Card 2</div>
            <div class="collection-filters">Filters form</div>
        </body>
    </html>
    """
    signals = parse_page(html, "collection", "https://mockstore.com/collections/fall")
    
    assert signals["page_type"] == "collection"
    assert signals["collection_title"] == "Fall Collection"
    assert signals["product_count_visible"] == 2
    assert signals["has_filters"] is True
