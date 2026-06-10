"""
API роутер для товаров (products).
CRUD операции над каталогом хозяйственных товаров.
"""

import logging
import math
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_db, get_current_user, require_admin
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["Товары"])


@router.get("/", response_model=ProductListResponse)
async def list_products(
    category: str = Query(default="", description="Фильтр по категории"),
    search: str = Query(default="", description="Поиск по названию"),
    sort: str = Query(
        default="created_at",
        description="Сортировка: price_asc, price_desc, name, created_at",
    ),
    page: int = Query(default=1, ge=1, description="Номер страницы"),
    page_size: int = Query(default=20, ge=1, le=100, description="Размер страницы"),
    db=Depends(get_db),
):
    """
    Получить список товаров с фильтрацией, поиском и пагинацией.
    Доступно без авторизации (публичный каталог).
    """
    offset = (page - 1) * page_size

    # Строим запрос
    query = db.table("products").select("*", count="exact")

    # Только активные товары для публичного каталога
    query = query.eq("is_active", True)

    # Фильтр по категории
    if category:
        query = query.eq("category", category)

    # Поиск по названию (ilike = case-insensitive LIKE)
    if search:
        query = query.ilike("name", f"%{search}%")

    # Сортировка
    if sort == "price_asc":
        query = query.order("price", desc=False)
    elif sort == "price_desc":
        query = query.order("price", desc=True)
    elif sort == "name":
        query = query.order("name", desc=False)
    else:
        query = query.order("created_at", desc=True)

    # Пагинация
    response = query.range(offset, offset + page_size - 1).execute()

    total = response.count or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return ProductListResponse(
        items=[ProductResponse(**p) for p in response.data],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db=Depends(get_db),
):
    """
    Получить один товар по ID.
    Доступно без авторизации.
    """
    response = db.table("products").select("*").eq("id", product_id).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар с ID {product_id} не найден",
        )

    return ProductResponse(**response.data[0])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    admin: dict[str, Any] = Depends(require_admin),
    db=Depends(get_db),
):
    """
    Создать новый товар.
    Доступно только администратору.
    """
    product_data = product.model_dump()

    logger.info(f"Админ {admin['id']} создаёт товар: {product_data['name']}")

    response = db.table("products").insert(product_data).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при создании товара",
        )

    return ProductResponse(**response.data[0])


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    admin: dict[str, Any] = Depends(require_admin),
    db=Depends(get_db),
):
    """
    Обновить товар по ID.
    Доступно только администратору. Обновляются только переданные поля.
    """
    # Проверяем существование товара
    existing = db.table("products").select("id").eq("id", product_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар с ID {product_id} не найден",
        )

    # Фильтруем None — обновляем только переданные поля
    update_data = product.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нет данных для обновления",
        )

    logger.info(
        f"Админ {admin['id']} обновляет товар {product_id}: "
        f"{list(update_data.keys())}"
    )

    response = (
        db.table("products")
        .update(update_data)
        .eq("id", product_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при обновлении товара",
        )

    return ProductResponse(**response.data[0])


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    admin: dict[str, Any] = Depends(require_admin),
    db=Depends(get_db),
):
    """
    Удалить товар по ID (мягкое удаление — is_active = False).
    Доступно только администратору.
    """
    # Проверяем существование товара
    existing = db.table("products").select("id").eq("id", product_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Товар с ID {product_id} не найден",
        )

    logger.info(f"Админ {admin['id']} удаляет товар {product_id}")

    # Мягкое удаление — деактивируем товар
    db.table("products").update({"is_active": False}).eq("id", product_id).execute()

    return None
