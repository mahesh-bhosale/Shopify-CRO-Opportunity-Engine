from app.utils.helpers import validate_url, is_shopify_store

def test_validate_url():
    assert validate_url("https://allbirds.com") is True
    assert validate_url("http://gymshark.co.uk/collections") is True
    assert validate_url("not-a-url") is False
    assert validate_url("http://localhost:3000") is True

def test_is_shopify_store():
    assert is_shopify_store("https://brand.myshopify.com") is True
    assert is_shopify_store("https://shopify.com/something") is True
    assert is_shopify_store("https://google.com") is False
