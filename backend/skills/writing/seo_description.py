# Inspired by coreyhaines31/marketingskills (ai-seo skill)
"""
Модуль генерации SEO-описаний товаров HOZWORK.

Шаблонная система для создания оптимизированных под поисковые системы
заголовков, мета-описаний и полных описаний товаров.
Ориентирован на русскоязычный рынок хозяйственных товаров.
"""

from __future__ import annotations

import re
from typing import Any


# Шаблоны SEO-заголовков — подбираются по категории товара
_TITLE_TEMPLATES: dict[str, list[str]] = {
    "default": [
        "{name} — купить по цене {price} ₽ | HOZWORK",
        "{name} — {category} с доставкой | HOZWORK",
        "Купить {name} недорого — {price} ₽ | HOZWORK",
    ],
    "cleaning": [
        "{name} для уборки — купить по цене {price} ₽ | HOZWORK",
        "{name} — профессиональное средство для чистоты | HOZWORK",
    ],
    "tools": [
        "{name} — хозяйственный инвентарь по цене {price} ₽ | HOZWORK",
        "{name} — качественный инструмент для дома | HOZWORK",
    ],
    "safety": [
        "{name} — средства защиты, цена {price} ₽ | HOZWORK",
        "{name} — индивидуальная защита для работы | HOZWORK",
    ],
}

# Шаблоны мета-описаний
_META_TEMPLATES: dict[str, list[str]] = {
    "default": [
        "Купить {name} ({category}) по цене {price} ₽ в интернет-магазине HOZWORK. "
        "{properties_text} Быстрая доставка, гарантия качества.",
        "{name} — {category} в наличии. Цена от {price} ₽. "
        "Закажите с доставкой на HOZWORK. {properties_text}",
    ],
    "cleaning": [
        "{name} для профессиональной уборки. {properties_text} "
        "Цена {price} ₽. Заказать в HOZWORK с доставкой.",
    ],
    "tools": [
        "{name} — надёжный хозяйственный инвентарь. {properties_text} "
        "Цена {price} ₽. Магазин HOZWORK.",
    ],
    "safety": [
        "{name} — средства индивидуальной защиты. {properties_text} "
        "От {price} ₽ в HOZWORK. Сертифицированная продукция.",
    ],
}

# Шаблон полного описания
_FULL_DESCRIPTION_TEMPLATE = """
<h2>{name}</h2>

<p>{intro_text}</p>

<h3>Характеристики</h3>
<ul>
{properties_list}
</ul>

<h3>Преимущества</h3>
<ul>
{benefits_list}
</ul>

<p><strong>Цена:</strong> {price} ₽</p>
<p><strong>Категория:</strong> {category}</p>

<p>{cta_text}</p>
""".strip()

# Вводные фразы для разных категорий
_INTRO_PHRASES: dict[str, list[str]] = {
    "default": [
        "{name} — качественный товар из категории «{category}», "
        "доступный для заказа в интернет-магазине HOZWORK.",
        "Представляем {name} — надёжный выбор для решения хозяйственных задач.",
    ],
    "cleaning": [
        "{name} — эффективное средство для поддержания чистоты и порядка "
        "в доме, офисе и на производстве.",
    ],
    "tools": [
        "{name} — практичный и долговечный хозяйственный инструмент "
        "для ежедневного использования.",
    ],
    "safety": [
        "{name} — надёжное средство защиты, соответствующее стандартам безопасности.",
    ],
}

# Преимущества по категориям
_BENEFITS: dict[str, list[str]] = {
    "default": [
        "Высокое качество материалов",
        "Доступная цена",
        "Быстрая доставка по всей России",
        "Гарантия от производителя",
    ],
    "cleaning": [
        "Эффективно удаляет загрязнения",
        "Безопасен для поверхностей",
        "Экономичный расход",
        "Приятный аромат",
    ],
    "tools": [
        "Прочная конструкция",
        "Эргономичная рукоятка",
        "Долгий срок службы",
        "Универсальное применение",
    ],
    "safety": [
        "Сертифицированная продукция",
        "Комфорт при длительном использовании",
        "Устойчивость к износу",
        "Соответствие ГОСТ",
    ],
}

# CTA-фразы (призыв к действию)
_CTA_PHRASES = [
    "Закажите {name} прямо сейчас в HOZWORK с доставкой!",
    "Добавьте {name} в корзину и оформите заказ с быстрой доставкой.",
    "Купите {name} в HOZWORK — надёжно, быстро, выгодно!",
]

# Маппинг ключевых слов категории на внутренний тип
_CATEGORY_MAPPING: dict[str, str] = {
    "уборка": "cleaning",
    "чистка": "cleaning",
    "моющие": "cleaning",
    "клининг": "cleaning",
    "дезинфекция": "cleaning",
    "инструмент": "tools",
    "инвентарь": "tools",
    "швабра": "tools",
    "ведро": "tools",
    "щётка": "tools",
    "перчатки": "safety",
    "защита": "safety",
    "маска": "safety",
    "респиратор": "safety",
    "очки": "safety",
}


def _detect_category_type(category: str) -> str:
    """Определяет внутренний тип категории по ключевым словам.

    Бизнес-логика:
    - Ищем ключевые слова из названия категории
    - Если не нашли совпадений — используем шаблон «default»

    Args:
        category: Название категории товара.

    Returns:
        Внутренний тип: ``cleaning``, ``tools``, ``safety``, ``default``.
    """
    category_lower = category.lower()
    for keyword, cat_type in _CATEGORY_MAPPING.items():
        if keyword in category_lower:
            return cat_type
    return "default"


def _format_properties_text(properties: dict[str, Any]) -> str:
    """Форматирует свойства товара в читабельную строку.

    Args:
        properties: Словарь характеристик товара.

    Returns:
        Строка вида «Цвет: синий, Размер: L».
    """
    if not properties:
        return ""
    parts = [f"{k}: {v}" for k, v in properties.items() if v]
    return ". ".join(parts) + "." if parts else ""


def _format_properties_list(properties: dict[str, Any]) -> str:
    """Форматирует свойства в HTML-список.

    Args:
        properties: Словарь характеристик.

    Returns:
        Строка HTML ``<li>`` элементов.
    """
    if not properties:
        return "<li>Уточняйте характеристики у менеджера</li>"
    lines = [f"<li><strong>{k}:</strong> {v}</li>" for k, v in properties.items() if v]
    return "\n".join(lines) if lines else "<li>—</li>"


def _truncate(text: str, max_length: int) -> str:
    """Обрезает текст до максимальной длины, сохраняя целые слова.

    Args:
        text: Исходный текст.
        max_length: Максимальная длина.

    Returns:
        Обрезанный текст.
    """
    if len(text) <= max_length:
        return text
    truncated = text[:max_length].rsplit(" ", 1)[0]
    return truncated.rstrip(".,;:") + "..."


def generate_seo_description(
    name: str,
    category: str,
    price: float,
    properties: dict[str, Any] | None = None,
) -> dict[str, str]:
    """Генерирует SEO-оптимизированное описание товара.

    Бизнес-логика:
    - Title — до 70 символов, содержит название, цену и бренд
    - Meta description — до 160 символов, с ключевыми характеристиками
    - Full description — HTML с заголовками, списками, CTA

    Args:
        name: Название товара.
        category: Категория товара.
        price: Цена товара в рублях.
        properties: Дополнительные характеристики товара
            (например: ``{"Цвет": "синий", "Размер": "L"}``).

    Returns:
        dict::

            {
                "title": str,        # SEO-заголовок (≤70 символов)
                "meta_description": str,  # Мета-описание (≤160 символов)
                "full_description": str   # Полное HTML-описание
            }
    """
    if properties is None:
        properties = {}

    cat_type = _detect_category_type(category)
    price_str = f"{price:,.0f}".replace(",", " ")
    properties_text = _format_properties_text(properties)

    # Словарь подстановок для шаблонов
    context = {
        "name": name,
        "category": category,
        "price": price_str,
        "properties_text": properties_text,
    }

    # ── SEO Title ──
    title_templates = _TITLE_TEMPLATES.get(cat_type, _TITLE_TEMPLATES["default"])
    title = title_templates[0].format(**context)
    title = _truncate(title, 70)

    # ── Meta Description ──
    meta_templates = _META_TEMPLATES.get(cat_type, _META_TEMPLATES["default"])
    meta = meta_templates[0].format(**context)
    meta = _truncate(meta, 160)

    # ── Full Description ──
    intro_phrases = _INTRO_PHRASES.get(cat_type, _INTRO_PHRASES["default"])
    intro = intro_phrases[0].format(**context)

    benefits = _BENEFITS.get(cat_type, _BENEFITS["default"])
    benefits_html = "\n".join(f"<li>{b}</li>" for b in benefits)

    cta = _CTA_PHRASES[0].format(**context)

    full_description = _FULL_DESCRIPTION_TEMPLATE.format(
        name=name,
        intro_text=intro,
        properties_list=_format_properties_list(properties),
        benefits_list=benefits_html,
        price=price_str,
        category=category,
        cta_text=cta,
    )

    # Чистим лишние пробелы
    full_description = re.sub(r"\n{3,}", "\n\n", full_description).strip()

    return {
        "title": title,
        "meta_description": meta,
        "full_description": full_description,
    }
