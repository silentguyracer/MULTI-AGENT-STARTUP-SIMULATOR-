from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Startup Simulator"
    DATABASE_URL: str = "sqlite+aiosqlite:///./startup_sim.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    OPENAI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    E2B_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
