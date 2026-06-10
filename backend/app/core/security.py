"""
Безопасность и аутентификация.
Верификация JWT-токенов Supabase, извлечение текущего пользователя.
"""

from typing import Any

from fastapi import Request, HTTPException, status, Depends
from jose import jwt, JWTError

from app.core.config import settings


# Supabase JWT использует HMAC с anon key как секретом,
# либо проверяется через JWKS. Для простоты используем JWT secret.
SUPABASE_JWT_SECRET = settings.SUPABASE_ANON_KEY
ALGORITHM = "HS256"


def decode_token(token: str) -> dict[str, Any]:
    """
    Декодирование и верификация Supabase JWT-токена.
    Возвращает payload токена с данными пользователя.
    """
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            options={
                "verify_aud": False,  # Supabase не всегда передаёт audience
                "verify_exp": True,
            },
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Невалидный токен: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(request: Request) -> dict[str, Any]:
    """
    FastAPI dependency — извлечение текущего пользователя из Authorization header.
    Ожидает формат: Bearer <token>
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Отсутствует заголовок Authorization",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Разбираем Bearer-токен
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный формат Authorization. Ожидается: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    payload = decode_token(token)

    # Извлекаем user_id из sub claim
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен не содержит идентификатор пользователя",
        )

    return {
        "id": user_id,
        "email": payload.get("email", ""),
        "role": payload.get("role", "authenticated"),
        "app_metadata": payload.get("app_metadata", {}),
        "user_metadata": payload.get("user_metadata", {}),
    }


async def require_admin(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """
    FastAPI dependency — проверка что пользователь является администратором.
    Проверяет role == 'admin' или наличие admin в app_metadata.
    """
    is_admin = (
        user.get("role") == "admin"
        or user.get("role") == "service_role"
        or user.get("app_metadata", {}).get("role") == "admin"
    )
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права администратора.",
        )
    return user
