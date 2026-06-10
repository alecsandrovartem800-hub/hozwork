"""
Общие зависимости для API эндпоинтов.
Переэкспорт зависимостей для удобного импорта в роутерах.
"""

from typing import Any

from fastapi import Depends
from supabase import Client

from app.core.supabase_client import get_supabase as _get_supabase
from app.core.security import get_current_user as _get_current_user
from app.core.security import require_admin as _require_admin


def get_db() -> Client:
    """
    Зависимость: получить клиент Supabase (admin).
    Используется во всех эндпоинтах для работы с БД.
    """
    return _get_supabase()


async def get_current_user(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    """
    Зависимость: получить текущего авторизованного пользователя.
    Извлекает и верифицирует JWT из заголовка Authorization.
    """
    return user


async def require_admin(user: dict[str, Any] = Depends(_require_admin)) -> dict[str, Any]:
    """
    Зависимость: требуется роль администратора.
    Проверяет авторизацию + наличие роли admin.
    """
    return user
