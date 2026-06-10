"""
Бизнес-логика заказов.
Транзакционное создание заказа: валидация → расчёт → оплата залога → запись в БД.
"""

import logging
import uuid
from datetime import datetime, timezone

from app.core.supabase_client import get_supabase
from app.services.deposit import calculate_deposit, process_deposit_payment

logger = logging.getLogger(__name__)


async def create_order(
    user_id: str,
    items: list[dict],
    delivery_address: str = "",
    comment: str = "",
    phone: str = "",
    email: str = "",
) -> dict:
    """
    Создание заказа с полным транзакционным циклом:
    1. Валидация товаров и проверка остатков
    2. Расчёт общей суммы и залога
    3. Обработка депозитного платежа (mock)
    4. Создание заказа + позиций + записи о депозите в Supabase
    
    Args:
        user_id: ID пользователя (из JWT)
        items: Список [{product_id, quantity}]
        delivery_address: Адрес доставки
        comment: Комментарий к заказу
        phone: Телефон для связи
        email: Email пользователя
        
    Returns:
        Полные данные созданного заказа
        
    Raises:
        ValueError: Если товар не найден или нет в наличии
    """
    db = get_supabase()

    # ── Шаг 1: Валидация товаров и получение актуальных цен ──
    product_ids = [item["product_id"] for item in items]
    products_response = (
        db.table("products")
        .select("*")
        .in_("id", product_ids)
        .execute()
    )
    products = {p["id"]: p for p in products_response.data}

    # Проверяем что все товары найдены
    enriched_items = []
    for item in items:
        product = products.get(item["product_id"])
        if not product:
            raise ValueError(f"Товар с ID {item['product_id']} не найден")
        if not product.get("is_active", True):
            raise ValueError(f"Товар '{product['name']}' недоступен для заказа")
        if product.get("stock", 0) < item["quantity"]:
            raise ValueError(
                f"Недостаточно товара '{product['name']}' на складе. "
                f"Доступно: {product.get('stock', 0)}, запрошено: {item['quantity']}"
            )

        enriched_items.append({
            "product_id": item["product_id"],
            "product_name": product["name"],
            "quantity": item["quantity"],
            "price": float(product["price"]),
            "deposit_percent": float(product.get("deposit_percent", 30.0)),
        })

    # ── Шаг 2: Расчёт сумм ──
    total_amount = sum(
        item["price"] * item["quantity"] for item in enriched_items
    )
    deposit_amount = calculate_deposit(enriched_items)

    # ── Шаг 3: Обработка депозитного платежа ──
    # Платёж должен пройти ДО создания заказа (транзакционная целостность)
    order_id = str(uuid.uuid4())
    payment_result = await process_deposit_payment(deposit_amount, order_id)

    if payment_result["status"] != "success":
        raise ValueError(
            f"Ошибка оплаты залога: {payment_result.get('message', 'Неизвестная ошибка')}"
        )

    # ── Шаг 4: Создание заказа в БД ──
    now = datetime.now(timezone.utc).isoformat()

    # Создаём заказ
    order_data = {
        "id": order_id,
        "user_id": user_id,
        "status": "deposit_paid",
        "total_amount": round(total_amount, 2),
        "deposit_amount": round(deposit_amount, 2),
        "deposit_paid": True,
        "delivery_address": delivery_address,
        "comment": comment,
        "phone": phone,
        "created_at": now,
        "updated_at": now,
    }
    db.table("orders").insert(order_data).execute()

    # Создаём позиции заказа
    order_items_data = []
    for item in enriched_items:
        order_items_data.append({
            "id": str(uuid.uuid4()),
            "order_id": order_id,
            "product_id": item["product_id"],
            "product_name": item["product_name"],
            "quantity": item["quantity"],
            "price": item["price"],
            "subtotal": round(item["price"] * item["quantity"], 2),
        })
    db.table("order_items").insert(order_items_data).execute()

    # Создаём запись о депозите
    deposit_record = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "amount": round(deposit_amount, 2),
        "status": "success",
        "payment_provider_id": payment_result["payment_provider_id"],
        "payment_method": payment_result.get("payment_method", "mock_card"),
        "created_at": now,
    }
    db.table("deposits").insert(deposit_record).execute()

    # ── Шаг 5: Обновление остатков на складе ──
    for item in enriched_items:
        product = products[item["product_id"]]
        new_stock = max(0, product.get("stock", 0) - item["quantity"])
        db.table("products").update({"stock": new_stock}).eq("id", item["product_id"]).execute()

    # Собираем полный ответ
    order_data["items"] = order_items_data
    order_data["email"] = email

    logger.info(
        f"Заказ {order_id} создан: {len(enriched_items)} товаров, "
        f"сумма {total_amount:.2f} ₽, залог {deposit_amount:.2f} ₽"
    )

    return order_data


async def get_user_orders(
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    is_admin: bool = False,
) -> dict:
    """
    Получение списка заказов.
    Клиент видит только свои заказы, админ — все.
    """
    db = get_supabase()
    offset = (page - 1) * page_size

    # Базовый запрос
    query = db.table("orders").select("*", count="exact")

    # Клиент видит только свои заказы
    if not is_admin:
        query = query.eq("user_id", user_id)

    # Сортировка и пагинация
    response = (
        query
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )

    # Получаем позиции для каждого заказа
    orders = response.data
    if orders:
        order_ids = [o["id"] for o in orders]
        items_response = (
            db.table("order_items")
            .select("*")
            .in_("order_id", order_ids)
            .execute()
        )

        # Группируем позиции по заказам
        items_by_order: dict[str, list] = {}
        for item in items_response.data:
            order_id = item["order_id"]
            if order_id not in items_by_order:
                items_by_order[order_id] = []
            items_by_order[order_id].append(item)

        for order in orders:
            order["items"] = items_by_order.get(order["id"], [])

    total = response.count or 0
    return {
        "items": orders,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def get_order_by_id(order_id: str, user_id: str | None = None) -> dict | None:
    """
    Получение заказа по ID с позициями.
    Если user_id указан — проверяет что заказ принадлежит пользователю.
    """
    db = get_supabase()

    query = db.table("orders").select("*").eq("id", order_id)
    if user_id:
        query = query.eq("user_id", user_id)

    response = query.execute()

    if not response.data:
        return None

    order = response.data[0]

    # Получаем позиции заказа
    items_response = (
        db.table("order_items")
        .select("*")
        .eq("order_id", order_id)
        .execute()
    )
    order["items"] = items_response.data

    return order


async def update_order_status(order_id: str, new_status: str, comment: str = "") -> dict | None:
    """
    Обновление статуса заказа (только для админа).
    Возвращает обновлённый заказ или None если заказ не найден.
    """
    db = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # Проверяем существование заказа
    existing = db.table("orders").select("*").eq("id", order_id).execute()
    if not existing.data:
        return None

    # Обновляем статус
    update_data = {
        "status": new_status,
        "updated_at": now,
    }
    db.table("orders").update(update_data).eq("id", order_id).execute()

    # Логируем изменение статуса
    status_log = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "old_status": existing.data[0].get("status", ""),
        "new_status": new_status,
        "comment": comment,
        "created_at": now,
    }
    try:
        db.table("order_status_history").insert(status_log).execute()
    except Exception as e:
        # Таблица истории статусов может не существовать
        logger.warning(f"Не удалось записать историю статусов: {e}")

    # Возвращаем обновлённый заказ
    return await get_order_by_id(order_id)
