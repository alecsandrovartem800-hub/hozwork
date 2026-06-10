"""
Supabase клиент.
Создание и предоставление клиента Supabase с сервисным ключом (admin).
"""

from supabase import create_client, Client

from app.core.config import settings

# Глобальный экземпляр клиента Supabase (admin-доступ через service role key)
_supabase_client: Client | None = None


def get_supabase() -> Client:
    """
    Получить клиент Supabase (singleton).
    Использует service role key для полного доступа к данным.
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_SERVICE_KEY,
        )
    return _supabase_client


def get_anon_supabase() -> Client:
    """
    Получить анонимный клиент Supabase.
    Используется для операций от имени пользователя (с RLS).
    """
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_ANON_KEY,
    )
