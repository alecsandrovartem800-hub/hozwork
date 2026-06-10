# Inspired by K-Dense-AI/claude-scientific-skills (scikit-learn pipelines)
"""
Модуль рекомендаций товаров HOZWORK на основе совместных покупок.

Строит матрицу совместных покупок по истории заказов и использует
косинусное сходство для поиска товаров, которые часто покупают вместе.
"""

from __future__ import annotations

import random
from collections import defaultdict
from typing import Any

try:
    import numpy as np
except ImportError as exc:
    raise ImportError("Необходим numpy: pip install numpy") from exc

try:
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    # Фолбэк: собственная реализация косинусного сходства
    cosine_similarity = None  # type: ignore[assignment]


def _fallback_cosine_similarity(matrix: np.ndarray) -> np.ndarray:
    """Вычисляет косинусное сходство без sklearn (запасной вариант).

    Args:
        matrix: Матрица размерности (n, m).

    Returns:
        Квадратная матрица сходства (n, n).
    """
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    normalized = matrix / norms
    return normalized @ normalized.T


def build_copurchase_matrix(
    order_items: list[dict[str, Any]],
) -> tuple[np.ndarray, list[str]]:
    """Строит матрицу совместных покупок по данным заказов.

    Бизнес-логика:
    - Группируем позиции по order_id
    - Для каждого заказа считаем, какие товары купили вместе
    - Строим квадратную матрицу co-purchase для всех товаров

    Args:
        order_items: Список позиций заказов. Каждый элемент —
            dict с ключами ``order_id`` и ``product_id``.
            Опционально: ``category``, ``name``.

    Returns:
        Кортеж (матрица совместных покупок, список product_id).
    """
    # Группируем товары по заказам
    orders: dict[str, list[str]] = defaultdict(list)
    for item in order_items:
        order_id = str(item["order_id"])
        product_id = str(item["product_id"])
        if product_id not in orders[order_id]:
            orders[order_id].append(product_id)

    # Собираем уникальные product_id
    all_products = sorted({str(item["product_id"]) for item in order_items})
    product_index = {pid: idx for idx, pid in enumerate(all_products)}
    n = len(all_products)

    # Строим матрицу совместных покупок
    matrix = np.zeros((n, n), dtype=np.float64)
    for products_in_order in orders.values():
        if len(products_in_order) < 2:
            continue
        for i, p1 in enumerate(products_in_order):
            for p2 in products_in_order[i + 1:]:
                idx1 = product_index[p1]
                idx2 = product_index[p2]
                matrix[idx1, idx2] += 1.0
                matrix[idx2, idx1] += 1.0

    return matrix, all_products


def get_recommendations(
    product_id: str,
    order_items: list[dict[str, Any]],
    top_n: int = 5,
) -> list[dict[str, Any]]:
    """Возвращает рекомендации товаров на основе совместных покупок.

    Алгоритм:
    1. Строим матрицу совместных покупок
    2. Вычисляем косинусное сходство
    3. Выбираем top_n наиболее похожих товаров
    4. Фолбэк: если данных недостаточно, выбираем случайные товары
       из той же категории

    Args:
        product_id: ID товара, для которого нужны рекомендации.
        order_items: Список позиций заказов (``order_id``, ``product_id``,
            опционально ``category``, ``name``).
        top_n: Количество рекомендаций (по умолчанию 5).

    Returns:
        Список рекомендаций::

            [
                {
                    "product_id": str,
                    "similarity_score": float,
                    "recommendation_type": "collaborative" | "category_fallback"
                },
                …
            ]
    """
    product_id = str(product_id)

    # Проверяем достаточность данных
    unique_orders = {str(item["order_id"]) for item in order_items}
    if len(unique_orders) < 3 or len(order_items) < 5:
        return _category_fallback(product_id, order_items, top_n)

    # Строим матрицу и считаем сходство
    matrix, product_list = build_copurchase_matrix(order_items)

    if product_id not in product_list:
        return _category_fallback(product_id, order_items, top_n)

    target_idx = product_list.index(product_id)

    # Косинусное сходство
    if cosine_similarity is not None:
        sim_matrix = cosine_similarity(matrix)
    else:
        sim_matrix = _fallback_cosine_similarity(matrix)

    # Извлекаем сходство для целевого товара
    similarities = sim_matrix[target_idx]
    similarities[target_idx] = -1.0  # исключаем сам товар

    # Берём top_n товаров с наибольшим сходством
    top_indices = np.argsort(similarities)[::-1][:top_n]
    results: list[dict[str, Any]] = []

    for idx in top_indices:
        score = float(similarities[idx])
        if score <= 0:
            break
        results.append(
            {
                "product_id": product_list[idx],
                "similarity_score": round(score, 4),
                "recommendation_type": "collaborative",
            }
        )

    # Если коллаборативная фильтрация дала мало результатов — дополняем фолбэком
    if len(results) < top_n:
        fallback = _category_fallback(
            product_id, order_items, top_n - len(results)
        )
        existing_ids = {r["product_id"] for r in results}
        for fb in fallback:
            if fb["product_id"] not in existing_ids:
                results.append(fb)
                if len(results) >= top_n:
                    break

    return results


def _category_fallback(
    product_id: str,
    order_items: list[dict[str, Any]],
    top_n: int,
) -> list[dict[str, Any]]:
    """Фолбэк: рекомендации из той же категории при недостатке данных.

    Бизнес-логика:
    - Если данных для коллаборативной фильтрации мало, просто предлагаем
      другие товары из той же категории.
    - Если категория неизвестна — случайные товары.

    Args:
        product_id: ID целевого товара.
        order_items: Все позиции заказов.
        top_n: Сколько рекомендаций вернуть.

    Returns:
        Список рекомендаций с типом ``category_fallback``.
    """
    # Определяем категорию целевого товара
    target_category: str | None = None
    for item in order_items:
        if str(item["product_id"]) == product_id:
            target_category = item.get("category")
            break

    # Собираем кандидатов из той же категории
    candidates: list[str] = []
    for item in order_items:
        pid = str(item["product_id"])
        if pid == product_id:
            continue
        if target_category and item.get("category") == target_category:
            if pid not in candidates:
                candidates.append(pid)
        elif not target_category:
            if pid not in candidates:
                candidates.append(pid)

    # Если кандидатов мало — берём все уникальные товары
    if len(candidates) < top_n:
        all_ids = list({str(it["product_id"]) for it in order_items} - {product_id})
        candidates = all_ids

    selected = random.sample(candidates, min(top_n, len(candidates)))
    return [
        {
            "product_id": pid,
            "similarity_score": 0.0,
            "recommendation_type": "category_fallback",
        }
        for pid in selected
    ]
