from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    MAX_PAGES_TO_SCRAPE: int = 4
    CORS_ORIGINS: str = "http://localhost:3000"


settings = Settings()
