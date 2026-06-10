# Inspired by K-Dense-AI/claude-scientific-skills (knowledge graphs)
"""
Модуль графа знаний о товарах HOZWORK.

Строит граф связей между товарами на основе общей категории,
совпадающих ключевых слов в описаниях и предопределённых комплементарных
пар хозяйственных товаров. Использует NetworkX для анализа графа.
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

try:
    import networkx as nx
except ImportError as exc:
    raise ImportError(
        "Для работы модуля product_graph необходим networkx. "
        "Установите: pip install networkx"
    ) from exc


# ── Предопределённые комплементарные пары для хозяйственных товаров ──
# Бизнес-логика: товары, которые логически дополняют друг друга
# и часто используются вместе при уборке / обслуживании помещений
_COMPLEMENTARY_KEYWORDS: list[tuple[str, str, float]] = [
    # (ключевое слово 1, ключевое слово 2, вес связи)
    ("перчатки", "дезинфицирующее", 0.9),
    ("перчатки", "моющее", 0.8),
    ("перчатки", "дезинфектант", 0.9),
    ("перчатки", "антисептик", 0.85),
    ("швабра", "ведро", 0.95),
    ("швабра", "тряпка", 0.9),
    ("швабра", "насадка", 0.85),
    ("ведро", "тряпка", 0.8),
    ("ведро", "моп", 0.9),
    ("мусорный мешок", "корзина", 0.85),
    ("мусорный пакет", "ведро", 0.8),
    ("моющее средство", "губка", 0.9),
    ("моющее", "тряпка", 0.85),
    ("стекломой", "салфетка", 0.85),
    ("мыло", "дозатор", 0.9),
    ("мыло", "полотенце", 0.8),
    ("щётка", "совок", 0.95),
    ("метла", "совок", 0.9),
    ("пылесос", "мешок", 0.85),
    ("освежитель", "диспенсер", 0.8),
    ("туалетная бумага", "держатель", 0.85),
    ("полироль", "тряпка", 0.8),
    ("респиратор", "перчатки", 0.7),
    ("маска", "перчатки", 0.75),
    ("очки защитные", "перчатки", 0.7),
    ("средство от плесени", "перчатки", 0.8),
    ("хлорка", "перчатки", 0.9),
]

# Стоп-слова для извлечения ключевых слов из описаний
_STOP_WORDS = frozenset({
    "и", "в", "на", "с", "для", "по", "из", "от", "до", "за",
    "не", "что", "как", "это", "все", "или", "при", "к", "а",
    "но", "его", "её", "их", "так", "же", "уже", "то", "только",
    "он", "она", "оно", "они", "мы", "вы", "я", "ты",
    "также", "более", "менее", "очень", "можно", "нужно",
    "будет", "было", "быть", "есть", "этот", "тот", "такой",
    "который", "которая", "которое", "которые",
})


def _extract_keywords(text: str) -> set[str]:
    """Извлекает ключевые слова из текста описания товара.

    Бизнес-логика:
    - Приводим к нижнему регистру
    - Убираем знаки препинания
    - Фильтруем стоп-слова и короткие слова

    Args:
        text: Текст описания товара.

    Returns:
        Множество ключевых слов.
    """
    if not text:
        return set()
    words = re.findall(r"[а-яёa-z0-9]+", text.lower())
    return {w for w in words if w not in _STOP_WORDS and len(w) > 2}


def build_product_graph(products: list[dict[str, Any]]) -> nx.Graph:
    """Строит граф связей между товарами.

    Типы связей (рёбер) в графе:
    1. **same_category** — товары принадлежат одной категории
    2. **shared_keywords** — общие ключевые слова в описаниях
    3. **complementary** — предопределённые комплементарные пары

    Каждое ребро имеет атрибуты:
    - ``weight``: вес связи (0.0–1.0)
    - ``relation_type``: тип связи

    Args:
        products: Список товаров. Каждый товар — dict::

            {
                "id": str,
                "name": str,
                "category": str,
                "description": str (опционально)
            }

    Returns:
        ``nx.Graph`` — граф связей между товарами.
    """
    G = nx.Graph()

    # Добавляем узлы (товары)
    for product in products:
        pid = str(product["id"])
        G.add_node(
            pid,
            name=product.get("name", ""),
            category=product.get("category", ""),
            description=product.get("description", ""),
        )

    # Подготавливаем данные для эффективного сравнения
    product_data: dict[str, dict[str, Any]] = {}
    category_index: dict[str, list[str]] = defaultdict(list)

    for product in products:
        pid = str(product["id"])
        name = product.get("name", "")
        desc = product.get("description", "")
        category = product.get("category", "")
        keywords = _extract_keywords(f"{name} {desc}")

        product_data[pid] = {
            "name": name.lower(),
            "category": category,
            "keywords": keywords,
            "full_text": f"{name} {desc}".lower(),
        }
        if category:
            category_index[category].append(pid)

    product_ids = list(product_data.keys())

    # ── 1. Связи по категории ──
    for category, pids in category_index.items():
        for i in range(len(pids)):
            for j in range(i + 1, len(pids)):
                p1, p2 = pids[i], pids[j]
                # Вес зависит от количества товаров в категории
                # (чем меньше товаров — тем сильнее связь)
                weight = min(0.7, 3.0 / max(len(pids), 1))
                if G.has_edge(p1, p2):
                    G[p1][p2]["weight"] += weight
                    G[p1][p2]["relation_types"].append("same_category")
                else:
                    G.add_edge(
                        p1, p2,
                        weight=weight,
                        relation_type="same_category",
                        relation_types=["same_category"],
                    )

    # ── 2. Связи по общим ключевым словам ──
    for i in range(len(product_ids)):
        for j in range(i + 1, len(product_ids)):
            p1, p2 = product_ids[i], product_ids[j]
            kw1 = product_data[p1]["keywords"]
            kw2 = product_data[p2]["keywords"]
            common = kw1 & kw2

            if len(common) >= 2:
                # Коэффициент Жаккара
                jaccard = len(common) / max(len(kw1 | kw2), 1)
                weight = round(min(jaccard * 2, 0.8), 3)

                if G.has_edge(p1, p2):
                    G[p1][p2]["weight"] += weight
                    G[p1][p2]["relation_types"].append("shared_keywords")
                else:
                    G.add_edge(
                        p1, p2,
                        weight=weight,
                        relation_type="shared_keywords",
                        relation_types=["shared_keywords"],
                        common_keywords=list(common)[:5],
                    )

    # ── 3. Комплементарные связи ──
    for p1 in product_ids:
        for p2 in product_ids:
            if p1 >= p2:
                continue
            text1 = product_data[p1]["full_text"]
            text2 = product_data[p2]["full_text"]

            for kw1, kw2, comp_weight in _COMPLEMENTARY_KEYWORDS:
                if (kw1 in text1 and kw2 in text2) or (kw2 in text1 and kw1 in text2):
                    if G.has_edge(p1, p2):
                        G[p1][p2]["weight"] += comp_weight
                        if "complementary" not in G[p1][p2]["relation_types"]:
                            G[p1][p2]["relation_types"].append("complementary")
                    else:
                        G.add_edge(
                            p1, p2,
                            weight=comp_weight,
                            relation_type="complementary",
                            relation_types=["complementary"],
                        )
                    break  # Одного совпадения достаточно

    return G


def get_related_products(
    product_id: str,
    products: list[dict[str, Any]],
    top_n: int = 5,
) -> list[dict[str, Any]]:
    """Находит связанные товары по графу знаний.

    Алгоритм:
    1. Строим граф продуктов
    2. Находим соседей целевого товара
    3. Сортируем по весу связи (убывание)
    4. Возвращаем top_n самых связанных

    Args:
        product_id: ID целевого товара.
        products: Список всех товаров.
        top_n: Количество рекомендаций.

    Returns:
        Список связанных товаров::

            [
                {
                    "product_id": str,
                    "name": str,
                    "category": str,
                    "relevance_score": float,
                    "relation_types": list[str]
                },
                …
            ]
    """
    product_id = str(product_id)

    G = build_product_graph(products)

    if product_id not in G:
        return []

    # Собираем соседей с весами
    neighbors: list[tuple[str, float, list[str]]] = []
    for neighbor in G.neighbors(product_id):
        edge_data = G[product_id][neighbor]
        weight = edge_data.get("weight", 0.0)
        relation_types = edge_data.get("relation_types", [])
        neighbors.append((neighbor, weight, relation_types))

    # Сортируем по весу (убывание)
    neighbors.sort(key=lambda x: x[1], reverse=True)

    # Формируем результат
    results: list[dict[str, Any]] = []
    for pid, score, rel_types in neighbors[:top_n]:
        node_data = G.nodes[pid]
        results.append(
            {
                "product_id": pid,
                "name": node_data.get("name", ""),
                "category": node_data.get("category", ""),
                "relevance_score": round(float(score), 3),
                "relation_types": rel_types,
            }
        )

    return results
