# Inspired by InternScience/Awesome-Scientific-Skills (hypothesis testing)
"""
Модуль ANOVA для сравнения продаж по категориям HOZWORK.

Реализует однофакторный дисперсионный анализ (one-way ANOVA)
для определения статистически значимых различий между категориями товаров.
"""

from __future__ import annotations

from typing import Any

try:
    import numpy as np
    from scipy import stats as scipy_stats
except ImportError as exc:
    raise ImportError(
        "Для работы модуля anova необходимы numpy и scipy. "
        "Установите: pip install numpy scipy"
    ) from exc


def _category_summary(name: str, values: list[float]) -> dict[str, Any]:
    """Вычисляет описательную статистику для одной категории.

    Args:
        name: Название категории.
        values: Список значений продаж.

    Returns:
        Словарь со статистиками: mean, std, min, max, count.
    """
    arr = np.array(values, dtype=np.float64)
    return {
        "category": name,
        "count": int(len(arr)),
        "mean": round(float(np.mean(arr)), 2),
        "std": round(float(np.std(arr, ddof=1)) if len(arr) > 1 else 0.0, 2),
        "min": round(float(np.min(arr)), 2),
        "max": round(float(np.max(arr)), 2),
        "median": round(float(np.median(arr)), 2),
    }


def compare_categories(
    category_sales: dict[str, list[float]],
    alpha: float = 0.05,
) -> dict[str, Any]:
    """Проводит однофакторный дисперсионный анализ (one-way ANOVA).

    Бизнес-логика:
    - Сравниваем средние продажи по категориям товаров
    - Если p_value < alpha → различия статистически значимы
    - Формируем рекомендацию по результатам теста
    - Определяем лучшую и худшую категории по среднему

    Args:
        category_sales: Словарь ``{название_категории: [продажи]}``.
            Пример: ``{"Перчатки": [100, 150, 130], "Моющие": [200, 180, 220]}``.
        alpha: Уровень значимости (по умолчанию 0.05).

    Returns:
        JSON-сериализуемый dict::

            {
                "f_statistic": float,
                "p_value": float,
                "significant": bool,
                "alpha": float,
                "summary": str,
                "best_category": str,
                "worst_category": str,
                "category_stats": [...]
            }

    Raises:
        ValueError: Если менее двух категорий или категория пуста.
    """
    # Валидация: минимум 2 категории
    if len(category_sales) < 2:
        raise ValueError(
            "Для ANOVA необходимо минимум 2 категории, "
            f"получено: {len(category_sales)}."
        )

    # Проверяем, что каждая категория содержит данные
    for cat_name, values in category_sales.items():
        if not values:
            raise ValueError(f"Категория '{cat_name}' не содержит данных.")

    # Собираем описательную статистику по каждой категории
    groups = list(category_sales.values())
    category_stats = [
        _category_summary(name, values)
        for name, values in category_sales.items()
    ]

    # Выполняем ANOVA
    try:
        f_stat, p_value = scipy_stats.f_oneway(*groups)
    except Exception as e:
        return {
            "f_statistic": None,
            "p_value": None,
            "significant": False,
            "alpha": alpha,
            "summary": f"Ошибка при вычислении ANOVA: {str(e)}",
            "category_stats": category_stats,
        }

    # Обрабатываем NaN (возникает, если дисперсия нулевая)
    f_stat = float(f_stat) if not np.isnan(f_stat) else 0.0
    p_value = float(p_value) if not np.isnan(p_value) else 1.0

    significant = p_value < alpha

    # Определяем лучшую и худшую категорию по среднему
    best = max(category_stats, key=lambda c: c["mean"])
    worst = min(category_stats, key=lambda c: c["mean"])

    # Формируем текстовый вывод для бизнес-пользователей
    if significant:
        summary = (
            f"Различия между категориями статистически значимы "
            f"(F={f_stat:.2f}, p={p_value:.4f}). "
            f"Лучшая категория: {best['category']} "
            f"(средние продажи: {best['mean']:.2f} ₽). "
            f"Худшая: {worst['category']} "
            f"(средние продажи: {worst['mean']:.2f} ₽)."
        )
    else:
        summary = (
            f"Статистически значимых различий между категориями не обнаружено "
            f"(F={f_stat:.2f}, p={p_value:.4f}). "
            f"Продажи по категориям примерно одинаковы."
        )

    return {
        "f_statistic": round(f_stat, 4),
        "p_value": round(p_value, 6),
        "significant": significant,
        "alpha": alpha,
        "summary": summary,
        "best_category": best["category"],
        "worst_category": worst["category"],
        "category_stats": category_stats,
    }
