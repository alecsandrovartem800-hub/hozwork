# Inspired by K-Dense-AI/claude-scientific-skills (TimesFM forecasting)
"""
Модуль прогнозирования цен для HOZWORK.

Прогнозирует будущие цены товаров на основе исторических данных,
используя скользящее среднее и обнаружение тренда.
Фолбэк на простую экстраполяцию при недостатке данных.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

try:
    import numpy as np
except ImportError as exc:
    raise ImportError("Необходим numpy: pip install numpy") from exc

try:
    from scipy import stats as scipy_stats

    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


def _parse_historical_data(
    historical_prices: list[dict[str, Any]],
) -> tuple[list[datetime], np.ndarray]:
    """Парсит исторические данные цен.

    Args:
        historical_prices: ``[{"date": "YYYY-MM-DD", "price": float}, …]``.

    Returns:
        Кортеж (список дат, массив цен).
    """
    # Сортируем по дате
    sorted_data = sorted(historical_prices, key=lambda x: x["date"])
    dates = [datetime.fromisoformat(d["date"]) for d in sorted_data]
    prices = np.array([float(d["price"]) for d in sorted_data], dtype=np.float64)
    return dates, prices


def _moving_average(prices: np.ndarray, window: int) -> np.ndarray:
    """Вычисляет скользящее среднее.

    Бизнес-логика:
    - Используем простое скользящее среднее (SMA)
    - Для начальных точек (меньше окна) используем доступные данные

    Args:
        prices: Массив цен.
        window: Размер окна.

    Returns:
        Массив сглаженных цен (той же длины).
    """
    result = np.zeros_like(prices)
    for i in range(len(prices)):
        start = max(0, i - window + 1)
        result[i] = np.mean(prices[start : i + 1])
    return result


def _detect_trend(
    dates: list[datetime], prices: np.ndarray
) -> dict[str, Any]:
    """Определяет тренд в ценовом ряде.

    Бизнес-логика:
    - Линейная регрессия по дням от начала
    - Определяем направление и силу тренда
    - Возвращаем slope и intercept для прогноза

    Args:
        dates: Список дат.
        prices: Массив цен.

    Returns:
        Словарь с параметрами тренда.
    """
    origin = dates[0]
    x = np.array([(d - origin).days for d in dates], dtype=np.float64)

    if HAS_SCIPY and len(x) >= 3:
        slope, intercept, r_value, p_value, _ = scipy_stats.linregress(x, prices)
        r_squared = float(r_value ** 2)
    else:
        # Фолбэк: простое вычисление наклона через NumPy
        n = len(x)
        if n < 2:
            return {
                "slope": 0.0,
                "intercept": float(prices[-1]) if len(prices) > 0 else 0.0,
                "r_squared": 0.0,
                "direction": "stable",
            }
        x_mean = np.mean(x)
        y_mean = np.mean(prices)
        numerator = np.sum((x - x_mean) * (prices - y_mean))
        denominator = np.sum((x - x_mean) ** 2)
        slope = float(numerator / denominator) if denominator != 0 else 0.0
        intercept = float(y_mean - slope * x_mean)
        # Упрощённый R²
        ss_res = np.sum((prices - (slope * x + intercept)) ** 2)
        ss_tot = np.sum((prices - y_mean) ** 2)
        r_squared = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0
        p_value = 1.0

    # Определяем направление тренда
    price_range = float(np.max(prices) - np.min(prices))
    avg_price = float(np.mean(prices))
    # Порог: изменение за весь период > 2% от среднего
    total_change = abs(slope * float(x[-1]))
    threshold = avg_price * 0.02

    if total_change < threshold:
        direction = "stable"
    elif slope > 0:
        direction = "rising"
    else:
        direction = "falling"

    return {
        "slope": float(slope),
        "intercept": float(intercept),
        "r_squared": round(r_squared, 4),
        "direction": direction,
    }


def _simple_extrapolation(
    prices: np.ndarray, dates: list[datetime], periods: int
) -> list[dict[str, Any]]:
    """Простая экстраполяция: среднее последних значений.

    Фолбэк-метод, когда данных слишком мало для полноценного прогноза.

    Args:
        prices: Исторические цены.
        dates: Исторические даты.
        periods: Количество периодов прогноза.

    Returns:
        Список прогнозов.
    """
    last_price = float(prices[-1]) if len(prices) > 0 else 0.0
    last_date = dates[-1] if dates else datetime.now()

    # Среднее последних 3 точек (или всех, если меньше)
    recent = prices[-3:] if len(prices) >= 3 else prices
    avg_recent = float(np.mean(recent))

    forecast: list[dict[str, Any]] = []
    for i in range(1, periods + 1):
        future_date = last_date + timedelta(days=i)
        # Линейная интерполяция между последней ценой и средней
        predicted = avg_recent + (last_price - avg_recent) * 0.5
        forecast.append(
            {
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_price": round(max(predicted, 0.0), 2),
                "confidence": "low",
                "method": "simple_extrapolation",
            }
        )

    return forecast


def forecast_price(
    historical_prices: list[dict[str, Any]],
    periods: int = 7,
    ma_window: int = 5,
) -> list[dict[str, Any]]:
    """Прогнозирует будущие цены товара.

    Алгоритм:
    1. Если данных < 3 — простая экстраполяция (фолбэк)
    2. Вычисляем скользящее среднее для сглаживания
    3. Определяем тренд (линейная регрессия)
    4. Прогнозируем: MA-базис + тренд-корректировка

    Бизнес-логика:
    - Прогноз не допускает отрицательных цен
    - Уверенность прогноза снижается с удалением от последних данных
    - Результат содержит метаданные для оценки надёжности

    Args:
        historical_prices: Исторические данные
            ``[{"date": "YYYY-MM-DD", "price": float}, …]``.
        periods: Количество дней для прогноза (по умолчанию 7).
        ma_window: Окно скользящего среднего (по умолчанию 5).

    Returns:
        Список прогнозов::

            [
                {
                    "date": "YYYY-MM-DD",
                    "predicted_price": float,
                    "confidence": "high" | "medium" | "low",
                    "method": str
                },
                …
            ]

    Raises:
        ValueError: Если ``historical_prices`` пуст.
    """
    if not historical_prices:
        raise ValueError("Список исторических цен пуст.")

    dates, prices = _parse_historical_data(historical_prices)

    # Фолбэк при недостатке данных
    if len(prices) < 3:
        return _simple_extrapolation(prices, dates, periods)

    # Сглаживание скользящим средним
    smoothed = _moving_average(prices, min(ma_window, len(prices)))

    # Определяем тренд
    trend = _detect_trend(dates, prices)
    slope = trend["slope"]
    r_squared = trend["r_squared"]

    # Базис прогноза — среднее последних MA_WINDOW точек
    basis = float(np.mean(smoothed[-min(ma_window, len(smoothed)):]))
    last_date = dates[-1]
    last_x = (dates[-1] - dates[0]).days

    # Генерируем прогноз
    forecast: list[dict[str, Any]] = []
    for i in range(1, periods + 1):
        future_date = last_date + timedelta(days=i)
        future_x = last_x + i

        # Прогноз = базис (MA) + трендовая корректировка
        trend_component = slope * i
        predicted = basis + trend_component

        # Гарантируем неотрицательность цены
        predicted = max(predicted, 0.01)

        # Определяем уверенность прогноза
        if i <= 3 and r_squared > 0.7:
            confidence = "high"
        elif i <= 5 and r_squared > 0.4:
            confidence = "medium"
        else:
            confidence = "low"

        forecast.append(
            {
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_price": round(predicted, 2),
                "confidence": confidence,
                "method": "moving_average_trend",
            }
        )

    return forecast
