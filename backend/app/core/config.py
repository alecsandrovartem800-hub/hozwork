"""
Конфигурация приложения HOZWORK.
Загрузка переменных окружения через Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Настройки приложения.
    Все значения загружаются из .env файла или переменных окружения.
    """

    # Supabase — база данных и аутентификация
    SUPABASE_URL: str = "https://srqmqyldxmbdjxqjevxa.supabase.co"
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # Telegram — уведомления о заказах
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""  # Может быть пустым, регистрируется через /start

    # Платёжный шлюз (mock для разработки)
    PAYMENT_GATEWAY_KEY: str = "mock"

    # Email сервис (mock для разработки)
    EMAIL_SERVICE_KEY: str = "mock"

    # CORS — разрешённые источники
    CORS_ORIGINS: list[str] = ["*"]

    # Название и версия приложения
    APP_NAME: str = "HOZWORK API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


# Singleton instance — используется во всём приложении
settings = Settings()
