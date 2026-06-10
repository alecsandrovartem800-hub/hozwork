# Inspired by coreyhaines31/marketingskills (ab-testing skill)
"""
Модуль A/B-тестирования для HOZWORK.

Записывает события конверсий по вариантам теста и вычисляет
статистическую значимость различий между вариантами
с помощью критерия хи-квадрат (chi-squared test).
"""

from __future__ import annotations

import threading
from collections import defaultdict
from typing import Any

try:
    from scipy import stats as scipy_stats

    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

try:
    import numpy as np

    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


# ── In-memory хранилище событий ──
# Бизнес-логика: храним события в памяти для быстрого доступа.
# Для продакшена можно заменить на Redis/PostgreSQL.
_lock = threading.Lock()
_test_store: dict[str, dict[str, dict[str, int]]] = defaultdict(
    lambda: defaultdict(lambda: {"total": 0, "converted": 0})
)


def record_event(
    test_id: str,
    variant: str,
    converted: bool,
) -> None:
    """Записывает событие A/B-теста.

    Потокобезопасно обновляет счётчики для указанного теста и варианта.

    Args:
        test_id: Уникальный идентификатор теста
            (например, ``"homepage_button_color"``).
        variant: Название варианта (``"A"``, ``"B"``, ``"control"`` и т.д.).
        converted: Была ли конверсия (``True``/``False``).
    """
    with _lock:
        _test_store[test_id][variant]["total"] += 1
        if converted:
            _test_store[test_id][variant]["converted"] += 1


def record_events_batch(
    test_id: str,
    events: list[dict[str, Any]],
) -> int:
    """Записывает пакет событий A/B-теста.

    Args:
        test_id: Уникальный идентификатор теста.
        events: Список событий ``[{"variant": str, "converted": bool}, …]``.

    Returns:
        Количество записанных событий.
    """
    count = 0
    for event in events:
        variant = str(event["variant"])
        converted = bool(event.get("converted", False))
        record_event(test_id, variant, converted)
        count += 1
    return count


def get_test_results(
    test_id: str,
    alpha: float = 0.05,
) -> dict[str, Any]:
    """Возвращает результаты A/B-теста со статистическим анализом.

    Бизнес-логика:
    - Рассчитываем конверсию по каждому варианту
    - Применяем критерий хи-квадрат для проверки значимости
    - Определяем победителя (если различия значимы)
    - Рассчитываем «подъём» (lift) лучшего варианта

    Args:
        test_id: Уникальный идентификатор теста.
        alpha: Уровень значимости (по умолчанию 0.05).

    Returns:
        JSON-сериализуемый dict::

            {
                "test_id": str,
                "variants": {
                    "A": {"total": int, "converted": int, "conversion_rate": float},
                    …
                },
                "chi_squared": float | None,
                "p_value": float | None,
                "significant": bool,
                "winner": str | None,
                "lift_percent": float | None,
                "confidence": float,
                "recommendation": str
            }

    Raises:
        ValueError: Если тест не найден.
    """
    with _lock:
        if test_id not in _test_store:
            raise ValueError(f"Тест '{test_id}' не найден в хранилище.")
        test_data = dict(_test_store[test_id])

    # Рассчитываем конверсии
    variants: dict[str, dict[str, Any]] = {}
    for variant_name, counts in test_data.items():
        total = counts["total"]
        converted = counts["converted"]
        rate = converted / total if total > 0 else 0.0
        variants[variant_name] = {
            "total": total,
            "converted": converted,
            "conversion_rate": round(rate, 4),
        }

    variant_names = list(variants.keys())

    # Проверяем минимум 2 варианта
    if len(variant_names) < 2:
        return {
            "test_id": test_id,
            "variants": variants,
            "chi_squared": None,
            "p_value": None,
            "significant": False,
            "winner": None,
            "lift_percent": None,
            "confidence": 0.0,
            "recommendation": "Недостаточно вариантов для анализа (нужно минимум 2).",
        }

    # Проверяем минимальный объём данных
    total_events = sum(v["total"] for v in variants.values())
    if total_events < 30:
        return {
            "test_id": test_id,
            "variants": variants,
            "chi_squared": None,
            "p_value": None,
            "significant": False,
            "winner": None,
            "lift_percent": None,
            "confidence": 0.0,
            "recommendation": (
                f"Недостаточно данных для статистического анализа. "
                f"Собрано {total_events} событий, рекомендуется минимум 30."
            ),
        }

    # ── Критерий хи-квадрат ──
    chi_squared: float | None = None
    p_value: float | None = None

    if HAS_SCIPY:
        # Строим таблицу наблюдений (contingency table)
        observed = []
        for v in variant_names:
            conv = variants[v]["converted"]
            not_conv = variants[v]["total"] - conv
            observed.append([conv, max(not_conv, 0)])

        try:
            if HAS_NUMPY:
                obs_array = np.array(observed)
            else:
                obs_array = observed  # type: ignore[assignment]

            chi2, p, dof, expected = scipy_stats.chi2_contingency(obs_array)
            chi_squared = round(float(chi2), 4)
            p_value = round(float(p), 6)
        except Exception:
            # Если тест не может быть выполнен (нулевые ячейки и т.п.)
            chi_squared = None
            p_value = None
    else:
        # Фолбэк: простое сравнение без статистического теста
        chi_squared = None
        p_value = None

    significant = p_value is not None and p_value < alpha

    # Определяем победителя
    winner: str | None = None
    lift_percent: float | None = None

    if significant:
        # Победитель — вариант с наибольшей конверсией
        best_variant = max(variant_names, key=lambda v: variants[v]["conversion_rate"])
        winner = best_variant

        # Рассчитываем lift относительно худшего варианта
        rates = [variants[v]["conversion_rate"] for v in variant_names]
        min_rate = min(rates)
        best_rate = variants[best_variant]["conversion_rate"]
        if min_rate > 0:
            lift_percent = round((best_rate - min_rate) / min_rate * 100, 2)
        else:
            lift_percent = None

    # Уверенность (1 - p_value, ограниченная [0, 1])
    confidence = round(1.0 - p_value, 4) if p_value is not None else 0.0

    # Формируем рекомендацию
    if significant and winner:
        recommendation = (
            f"Вариант '{winner}' показывает статистически значимое "
            f"преимущество (p={p_value}). "
            f"Рекомендуется внедрить вариант '{winner}'."
        )
        if lift_percent is not None:
            recommendation += f" Прирост конверсии: +{lift_percent}%."
    elif p_value is not None and not significant:
        recommendation = (
            f"Различия между вариантами статистически не значимы (p={p_value}). "
            f"Рекомендуется продолжить тест или увеличить выборку."
        )
    else:
        recommendation = (
            "Невозможно провести статистический анализ. "
            "Убедитесь, что scipy установлен и данных достаточно."
        )

    return {
        "test_id": test_id,
        "variants": variants,
        "chi_squared": chi_squared,
        "p_value": p_value,
        "significant": significant,
        "winner": winner,
        "lift_percent": lift_percent,
        "confidence": confidence,
        "recommendation": recommendation,
    }


def reset_test(test_id: str) -> bool:
    """Сбрасывает данные теста.

    Args:
        test_id: Уникальный идентификатор теста.

    Returns:
        ``True`` если тест был удалён, ``False`` если не найден.
    """
    with _lock:
        if test_id in _test_store:
            del _test_store[test_id]
            return True
        return False


def list_tests() -> list[dict[str, Any]]:
    """Возвращает список всех активных тестов.

    Returns:
        Список тестов с базовой информацией::

            [
                {
                    "test_id": str,
                    "variants_count": int,
                    "total_events": int
                },
                …
            ]
    """
    with _lock:
        result = []
        for test_id, variants in _test_store.items():
            total = sum(v["total"] for v in variants.values())
            result.append(
                {
                    "test_id": test_id,
                    "variants_count": len(variants),
                    "total_events": total,
                }
            )
        return result
