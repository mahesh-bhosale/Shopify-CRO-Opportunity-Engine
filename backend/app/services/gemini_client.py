import logging
from google import genai
from google.genai import errors
from google.genai import types
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Reusable custom exceptions
class GeminiError(Exception):
    """Base exception for all Gemini client errors."""
    pass

class GeminiAuthError(GeminiError):
    """Raised when authentication fails or API key is invalid."""
    pass

class GeminiRateLimitError(GeminiError):
    """Raised when rate limits are exceeded."""
    pass

class GeminiTimeoutError(GeminiError):
    """Raised when a request to Gemini times out."""
    pass

class GeminiNetworkError(GeminiError):
    """Raised when a network connectivity issue occurs."""
    pass

class GeminiModelError(GeminiError):
    """Raised when the requested model is invalid or unsupported."""
    pass


def map_exception(exc: Exception) -> Exception:
    """
    Map native Google GenAI SDK and HTTPX exceptions to custom meaningful exceptions.
    """
    if isinstance(exc, errors.APIError):
        code = exc.code
        # 401/403: auth/permission errors
        if code in (401, 403):
            return GeminiAuthError(f"Gemini authentication failed (status={code}): {exc.message or str(exc)}")
        # 429: rate limit
        elif code == 429:
            return GeminiRateLimitError(f"Gemini rate limit exceeded (status=429): {exc.message or str(exc)}")
        # 404: model not found
        elif code == 404:
            return GeminiModelError(f"Gemini model not found (status=404): {exc.message or str(exc)}")
        else:
            return GeminiError(f"Gemini API returned error (status={code}): {exc.message or str(exc)}")
            
    if isinstance(exc, httpx.TimeoutException):
        return GeminiTimeoutError(f"Gemini request timed out: {str(exc)}")
    if isinstance(exc, httpx.NetworkError):
        return GeminiNetworkError(f"Gemini network connectivity issue: {str(exc)}")
        
    return GeminiError(f"Unexpected error in Gemini client: {str(exc)}")


# Log status immediately at module load time to satisfy startup logs requirement
if not settings.GEMINI_API_KEY:
    logger.warning("⚠ Gemini API key missing")
else:
    logger.info("✓ Gemini configured")


# Reusable Gemini Client instance
_client_instance = None

def get_gemini_client() -> genai.Client:
    """
    Returns the singleton google-genai Client.
    Initializes only once.
    """
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise GeminiAuthError("Gemini API key is not configured in settings.")

    try:
        # Default client timeout is set using types.HttpOptions
        _client_instance = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=60.0)
        )
        return _client_instance
    except Exception as exc:
        logger.error("Failed to initialize Gemini client: %s", exc)
        raise map_exception(exc)
