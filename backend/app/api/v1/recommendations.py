"""
API роутер для рекомендаций (recommendations).
Вызов ML-модулей рекомендаций (косинусное сходство совместных покупок) и графа знаний товаров.
"""

import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_db
from app.skills.ml.recommendation import get_recommendations
from app.skills.graph.product_graph import get_related_products

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["Рекомендации"])

@router.get("/{product_id}")
async def get_product_recommendations(
    product_id: str,
    top_n: int = Query(default=5, ge=1, le=20, description="Количество рекомендаций"),
    db=Depends(get_db),
):
    """
    Получить персональные рекомендации для товара на основе совместных покупок.
    Использует алгоритм коллаборативной фильтрации (ML/cosine similarity).
    """
    try:
        # 1. Загружаем все позиции заказов для построения матрицы совместных покупок
        orders_resp = db.table("order_items").select("order_id, product_id").execute()
        order_items = orders_resp.data

        # 2. Загружаем все товары из базы, чтобы знать названия и категории
        products_resp = db.table("products").select("*").execute()
        products = products_resp.data
        products_dict = {p["id"]: p for p in products}

        # 3. Вызываем ML модуль
        # Форматируем order_items как список словарей с product_id и order_id
        recommended_ids = get_recommendations(product_id, order_items, top_n)
        
        # Если рекомендаций нет, выберем случайные товары той же категории
        target_product = products_dict.get(product_id)
        recommendations = []
        
        if recommended_ids:
            for rid in recommended_ids:
                if rid in products_dict:
                    recommendations.append(products_dict[rid])
        
        # Фолбэк на ту же категорию, если рекомендаций не набралось
        if len(recommendations) < top_n and target_product:
            category = target_product.get("category")
            same_category = [
                p for p in products 
                if p["category"] == category and p["id"] != product_id and p["id"] not in [r["id"] for r in recommendations]
            ]
            import random
            random.shuffle(same_category)
            needed = top_n - len(recommendations)
            recommendations.extend(same_category[:needed])
            
        return recommendations[:top_n]
    except Exception as e:
        logger.error(f"Ошибка получения ML рекомендаций: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка сервера при подборе рекомендаций: {str(e)}"
        )

@router.get("/graph/{product_id}")
async def get_graph_recommendations(
    product_id: str,
    top_n: int = Query(default=5, ge=1, le=20, description="Количество связанных товаров"),
    db=Depends(get_db),
):
    """
    Получить связанные товары с помощью графа знаний.
    Связывает товары по категориям, ключевым словам и комплементарным связям (например, перчатки + средство).
    Использует модуль graph/product_graph.
    """
    try:
        # 1. Загружаем все товары для построения графа
        products_resp = db.table("products").select("*").execute()
        products = products_resp.data
        
        # Проверим, что товар вообще существует
        products_dict = {p["id"]: p for p in products}
        if product_id not in products_dict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Указанный товар не найден в каталоге"
            )

        # 2. Строим граф и получаем связанные товары
        related = get_related_products(product_id, products, top_n)
        return related
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения связанных товаров через граф: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка сервера при анализе графа связей: {str(e)}"
        )
