# Inspired by InternScience/Awesome-Scientific-Skills (visualization module)
"""
Модуль визуализации для админ-панели HOZWORK.

Генерирует JSON-конфигурации графиков Plotly для отображения
на фронтенде: продажи, категории, воронка конверсии, средний чек.
Все графики используют фирменную палитру HOZWORK (зелёные оттенки).
"""

from __future__ import annotations

from typing import Any

try:
    import plotly.graph_objects as go
    import plotly.io as pio

    HAS_PLOTLY = True
except ImportError:
    HAS_PLOTLY = False

# Фирменная палитра HOZWORK — зелёные оттенки
HOZWORK_COLORS = {
    "primary": "#2E7D32",       # тёмно-зелёный
    "secondary": "#4CAF50",     # средний зелёный
    "light": "#81C784",         # светло-зелёный
    "accent": "#A5D6A7",        # бледно-зелёный
    "bg": "#E8F5E9",            # фоновый зелёный
    "text": "#1B5E20",          # текст
    "grid": "#C8E6C9",          # сетка
    "warning": "#FF9800",       # оранжевый (предупреждения)
    "danger": "#F44336",        # красный (убытки)
}

# Общий шаблон оформления для всех графиков
_LAYOUT_DEFAULTS: dict[str, Any] = {
    "font": {"family": "Inter, Arial, sans-serif", "color": HOZWORK_COLORS["text"]},
    "paper_bgcolor": "white",
    "plot_bgcolor": HOZWORK_COLORS["bg"],
    "margin": {"l": 50, "r": 30, "t": 50, "b": 40},
}


def _to_dict(fig: Any) -> dict[str, Any]:
    """Конвертирует Plotly Figure в JSON-словарь.

    Args:
        fig: Объект ``plotly.graph_objects.Figure``.

    Returns:
        JSON-сериализуемый словарь.
    """
    if HAS_PLOTLY:
        return fig.to_dict()  # type: ignore[no-any-return]
    return fig


def create_sales_line_chart(
    daily_sales: list[dict[str, Any]],
) -> dict[str, Any]:
    """Строит линейный график продаж по дням.

    Бизнес-логика:
    - Основная линия — ежедневные продажи
    - Дополнительно показывается скользящее среднее за 7 дней
    - Подсветка зоны под графиком для визуального акцента

    Args:
        daily_sales: Список ``[{"date": "YYYY-MM-DD", "amount": float}, …]``.

    Returns:
        Plotly JSON dict (data + layout).
    """
    if not HAS_PLOTLY:
        return _fallback_chart("sales_line", daily_sales)

    dates = [d["date"] for d in daily_sales]
    amounts = [d["amount"] for d in daily_sales]

    fig = go.Figure()

    # Основная линия продаж
    fig.add_trace(
        go.Scatter(
            x=dates,
            y=amounts,
            mode="lines+markers",
            name="Продажи",
            line={"color": HOZWORK_COLORS["primary"], "width": 2},
            marker={"size": 5, "color": HOZWORK_COLORS["secondary"]},
            fill="tozeroy",
            fillcolor="rgba(76, 175, 80, 0.15)",
        )
    )

    # Скользящее среднее (7 дней)
    if len(amounts) >= 7:
        import numpy as np

        ma = np.convolve(amounts, np.ones(7) / 7, mode="valid").tolist()
        ma_dates = dates[6:]
        fig.add_trace(
            go.Scatter(
                x=ma_dates,
                y=[round(v, 2) for v in ma],
                mode="lines",
                name="Среднее (7 дн.)",
                line={
                    "color": HOZWORK_COLORS["warning"],
                    "width": 2,
                    "dash": "dash",
                },
            )
        )

    fig.update_layout(
        title="Продажи по дням",
        xaxis_title="Дата",
        yaxis_title="Сумма (₽)",
        **_LAYOUT_DEFAULTS,
    )

    return _to_dict(fig)


def create_category_bar_chart(
    category_data: dict[str, float],
) -> dict[str, Any]:
    """Строит столбчатую диаграмму продаж по категориям.

    Бизнес-логика:
    - Сортируем категории по убыванию продаж
    - Используем градиент зелёных оттенков
    - Подписи значений на столбцах

    Args:
        category_data: ``{"category_name": total_sales, …}``.

    Returns:
        Plotly JSON dict.
    """
    if not HAS_PLOTLY:
        return _fallback_chart("category_bar", category_data)

    # Сортируем категории по убыванию
    sorted_cats = sorted(category_data.items(), key=lambda x: x[1], reverse=True)
    categories = [c[0] for c in sorted_cats]
    values = [c[1] for c in sorted_cats]

    # Генерируем градиент цветов
    n = len(categories)
    colors = _generate_gradient(n)

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=categories,
            y=values,
            marker_color=colors,
            text=[f"{v:,.0f} ₽" for v in values],
            textposition="outside",
            name="Продажи",
        )
    )

    fig.update_layout(
        title="Продажи по категориям",
        xaxis_title="Категория",
        yaxis_title="Сумма (₽)",
        showlegend=False,
        **_LAYOUT_DEFAULTS,
    )

    return _to_dict(fig)


def create_conversion_funnel(
    views: int,
    carts: int,
    deposits: int,
) -> dict[str, Any]:
    """Строит воронку конверсии: просмотры → корзина → оплата залога.

    Бизнес-логика:
    - Три этапа воронки соответствуют бизнес-процессу HOZWORK
    - Показываем абсолютные значения и проценты конверсии

    Args:
        views: Количество просмотров товаров.
        carts: Количество добавлений в корзину.
        deposits: Количество оплаченных залогов.

    Returns:
        Plotly JSON dict.
    """
    if not HAS_PLOTLY:
        return _fallback_chart("funnel", {"views": views, "carts": carts, "deposits": deposits})

    stages = ["Просмотры", "Корзина", "Залог оплачен"]
    values = [views, carts, deposits]
    colors = [HOZWORK_COLORS["light"], HOZWORK_COLORS["secondary"], HOZWORK_COLORS["primary"]]

    # Рассчитываем конверсии
    conv_texts = [
        f"{views:,}",
        f"{carts:,} ({carts / views * 100:.1f}%)" if views > 0 else f"{carts:,}",
        f"{deposits:,} ({deposits / views * 100:.1f}%)" if views > 0 else f"{deposits:,}",
    ]

    fig = go.Figure()
    fig.add_trace(
        go.Funnel(
            y=stages,
            x=values,
            textinfo="value+percent initial",
            marker={"color": colors},
            connector={"line": {"color": HOZWORK_COLORS["grid"], "width": 2}},
        )
    )

    fig.update_layout(
        title="Воронка конверсии",
        **_LAYOUT_DEFAULTS,
    )

    return _to_dict(fig)


def create_avg_check_chart(
    weekly_data: list[dict[str, Any]],
) -> dict[str, Any]:
    """Строит график среднего чека по неделям.

    Бизнес-логика:
    - Показывает динамику среднего чека
    - Горизонтальная линия — целевой средний чек (если задан)

    Args:
        weekly_data: ``[{"week": "2024-W01", "avg_check": float}, …]``.

    Returns:
        Plotly JSON dict.
    """
    if not HAS_PLOTLY:
        return _fallback_chart("avg_check", weekly_data)

    weeks = [d["week"] for d in weekly_data]
    checks = [d["avg_check"] for d in weekly_data]

    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=weeks,
            y=checks,
            mode="lines+markers",
            name="Средний чек",
            line={"color": HOZWORK_COLORS["primary"], "width": 3},
            marker={
                "size": 8,
                "color": HOZWORK_COLORS["secondary"],
                "line": {"width": 2, "color": HOZWORK_COLORS["primary"]},
            },
        )
    )

    # Средняя горизонтальная линия
    if checks:
        avg = sum(checks) / len(checks)
        fig.add_hline(
            y=avg,
            line_dash="dot",
            line_color=HOZWORK_COLORS["warning"],
            annotation_text=f"Среднее: {avg:,.0f} ₽",
            annotation_position="top right",
        )

    fig.update_layout(
        title="Средний чек по неделям",
        xaxis_title="Неделя",
        yaxis_title="Средний чек (₽)",
        **_LAYOUT_DEFAULTS,
    )

    return _to_dict(fig)


def create_full_dashboard(data: dict[str, Any]) -> dict[str, Any]:
    """Генерирует полный набор графиков для админ-панели.

    Объединяет все графики в единый JSON-ответ для фронтенда.

    Args:
        data: Словарь с данными для каждого графика::

            {
                "daily_sales": [...],
                "category_data": {...},
                "views": int,
                "carts": int,
                "deposits": int,
                "weekly_data": [...]
            }

    Returns:
        dict со всеми графиками::

            {
                "sales_chart": {...},
                "category_chart": {...},
                "funnel_chart": {...},
                "avg_check_chart": {...}
            }
    """
    result: dict[str, Any] = {}

    if "daily_sales" in data:
        result["sales_chart"] = create_sales_line_chart(data["daily_sales"])

    if "category_data" in data:
        result["category_chart"] = create_category_bar_chart(data["category_data"])

    if all(k in data for k in ("views", "carts", "deposits")):
        result["funnel_chart"] = create_conversion_funnel(
            data["views"], data["carts"], data["deposits"]
        )

    if "weekly_data" in data:
        result["avg_check_chart"] = create_avg_check_chart(data["weekly_data"])

    return result


# ── Вспомогательные функции ──────────────────────────────────────────


def _generate_gradient(n: int) -> list[str]:
    """Генерирует градиент зелёных оттенков для n элементов.

    Args:
        n: Количество цветов.

    Returns:
        Список HEX-цветов.
    """
    if n <= 0:
        return []
    base_colors = [
        HOZWORK_COLORS["primary"],
        HOZWORK_COLORS["secondary"],
        HOZWORK_COLORS["light"],
        HOZWORK_COLORS["accent"],
    ]
    result: list[str] = []
    for i in range(n):
        result.append(base_colors[i % len(base_colors)])
    return result


def _fallback_chart(chart_type: str, data: Any) -> dict[str, Any]:
    """Фолбэк для генерации графиков без Plotly.

    Возвращает данные в упрощённом формате, который фронтенд
    может визуализировать через Chart.js или другую библиотеку.

    Args:
        chart_type: Тип графика.
        data: Исходные данные.

    Returns:
        Упрощённый JSON.
    """
    return {
        "chart_type": chart_type,
        "data": data,
        "error": "Plotly не установлен. Данные возвращены в сыром виде.",
        "colors": HOZWORK_COLORS,
    }
