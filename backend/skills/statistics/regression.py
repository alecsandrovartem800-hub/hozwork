# Inspired by K-Dense-AI/claude-scientific-skills (statsmodels integration)
"""
Модуль линейной регрессии для прогнозирования продаж HOZWORK.

Использует numpy и scipy.stats для построения линейной модели
по историческим данным о продажах и прогнозирования на 7 дней вперёд.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

try:
    import numpy as np
    from scipy import stats as scipy_stats
except ImportError as exc:
    raise ImportError(
        "Для работы модуля regression необходимы numpy и scipy. "
        "Установите: pip install numpy scipy"
    ) from exc


def _parse_dates(dates: list[str]) -> np.ndarray:
    """Преобразует список строковых дат в числовой массив (дни с начала).

    Args:
        dates: Даты в формате ISO-8601 (YYYY-MM-DD).

    Returns:
        Массив numpy с порядковыми номерами дней (0, 1, 2, …).
    """
    parsed = [datetime.fromisoformat(d) for d in dates]
    origin = min(parsed)
    return np.array([(d - origin).days for d in parsed], dtype=np.float64), parsed


def analyze_sales_trend(
    dates: list[str],
    amounts: list[float],
    forecast_days: int = 7,
) -> dict[str, Any]:
    """Строит линейную регрессию по данным продаж и прогнозирует будущее.

    Бизнес-логика:
    - Конвертируем даты в числовой ряд (кол-во дней от начала)
    - Строим линейную модель y = slope * x + intercept
    - Оцениваем качество модели через R²
    - Генерируем прогноз на forecast_days вперёд

    Args:
        dates: Список дат продаж в формате ``YYYY-MM-DD``.
        amounts: Объёмы продаж, соответствующие датам.
        forecast_days: Количество дней для прогноза (по умолчанию 7).

    Returns:
        JSON-сериализуемый dict::

            {
                "slope": float,
                "intercept": float,
                "r_squared": float,
                "p_value": float,
                "std_error": float,
                "trend": "growing" | "declining" | "stable",
                "forecast_next_7_days": [
                    {"date": "YYYY-MM-DD", "predicted_amount": float}, …
                ]
            }

    Raises:
        ValueError: Если длины ``dates`` и ``amounts`` не совпадают
                    или данных недостаточно (< 2 точек).
    """
    # Валидация входных данных
    if len(dates) != len(amounts):
        raise ValueError(
            f"Длины dates ({len(dates)}) и amounts ({len(amounts)}) не совпадают."
        )
    if len(dates) < 2:
        raise ValueError("Для регрессии нужно минимум 2 точки данных.")

    x_days, parsed_dates = _parse_dates(dates)
    y_amounts = np.array(amounts, dtype=np.float64)

    # Линейная регрессия через scipy
    slope, intercept, r_value, p_value, std_err = scipy_stats.linregress(
        x_days, y_amounts
    )
    r_squared = float(r_value ** 2)

    # Определяем тренд по наклону и статистической значимости
    if p_value > 0.05:
        trend = "stable"
    elif slope > 0:
        trend = "growing"
    else:
        trend = "declining"

    # Прогноз на будущие дни
    last_date = max(parsed_dates)
    max_x = float(x_days.max())
    forecast: list[dict[str, Any]] = []
    for i in range(1, forecast_days + 1):
        future_x = max_x + i
        predicted = float(slope * future_x + intercept)
        future_date = last_date + timedelta(days=i)
        forecast.append(
            {
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_amount": round(max(predicted, 0.0), 2),
            }
        )

    return {
        "slope": round(float(slope), 6),
        "intercept": round(float(intercept), 2),
        "r_squared": round(r_squared, 4),
        "p_value": round(float(p_value), 6),
        "std_error": round(float(std_err), 6),
        "trend": trend,
        "data_points": len(dates),
        "forecast_next_7_days": forecast,
    }
