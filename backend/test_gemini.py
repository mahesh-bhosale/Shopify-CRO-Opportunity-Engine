import os
import sys

# Ensure backend directory is in the Python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.config import settings

def test_gemini_connection():
    print("--------------------------------")
    print("Testing Gemini Connection...")
    print("--------------------------------\n")
    
    api_key = settings.GEMINI_API_KEY
    if not api_key or "your_actual" in api_key or api_key == "your_gemini_api_key_here":
        print("API Key Found [FAIL] (Missing or placeholder key in .env)")
        print("\nStatus:\n\nFAILURE")
        return

    print("API Key Found [OK]\n")
    print("Sending Test Request...\n")
    
    try:
        from app.services.gemini_client import get_gemini_client, map_exception
        client = get_gemini_client()
        
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="Reply with exactly: GEMINI_CONNECTION_OK"
        )
        
        text = response.text.strip()
        print("Response:\n")
        print(text)
        print("\nModel:\n")
        print(settings.GEMINI_MODEL)
        print("\nStatus:\n\nSUCCESS")
    except Exception as exc:
        try:
            from app.services.gemini_client import map_exception
            mapped_exc = map_exception(exc)
        except Exception:
            mapped_exc = exc
        print("Error details:")
        print(mapped_exc)
        print("\nStatus:\n\nFAILURE")

if __name__ == "__main__":
    test_gemini_connection()
