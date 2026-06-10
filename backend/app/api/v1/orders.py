"""
API роутер для заказов (orders).
Создание заказа с транзакционной оплатой залога, просмотр и управление статусами.
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_db, get_current_user, require_admin
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderItemResponse,
    OrderStatusUpdate,
    OrderListResponse,
)
from app.services.order import (
    create_order as service_create_order,
    get_user_orders,
    get_order_by_id,
    update_order_status as service_update_status,
)
from app.services.notification import notify_new_order, notify_status_change

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["Заказы"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order: OrderCreate,
    user: dict[str, Any] = Depends(get_current_user),
):
    """
    Создать новый заказ с оплатой залога.
    
    Транзакционный процесс:
    1. Валидация товаров и проверка остатков
    2. Расчёт общей суммы и залога
    3. Обработка депозитного платежа (mock)
    4. Создание заказа + позиций + записи о депозите
    5. Отправка уведомления в Telegram
    """
    try:
        # Формируем данные для сервиса
        items = [
            {"product_id": item.product_id, "quantity": item.quantity}
            for item in order.items
        ]

        # Создаём заказ (транзакционно)
        order_data = await service_create_order(
            user_id=user["id"],
            items=items,
            delivery_address=order.delivery_address,
            comment=order.comment,
            phone=order.phone,
            email=user.get("email", ""),
        )

        # Отправляем уведомление (не блокируем ответ при ошибке)
        try:
            await notify_new_order(order_data)
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления: {e}")

        # Формируем ответ
        return OrderResponse(
            id=order_data["id"],
            user_id=order_data["user_id"],
            status=order_data["status"],
            total_amount=order_data["total_amount"],
            deposit_amount=order_data["deposit_amount"],
            deposit_paid=order_data["deposit_paid"],
            delivery_address=order_data.get("delivery_address", ""),
            comment=order_data.get("comment", ""),
            phone=order_data.get("phone", ""),
            items=[
                OrderItemResponse(
                    id=item["id"],
                    product_id=item["product_id"],
                    product_name=item.get("product_name", ""),
                    quantity=item["quantity"],
                    price=item["price"],
                    subtotal=item["subtotal"],
                )
                for item in order_data.get("items", [])
            ],
            created_at=order_data.get("created_at"),
            updated_at=order_data.get("updated_at"),
        )

    except ValueError as e:
        # Бизнес-ошибки (товар не найден, нет на складе, ошибка оплаты)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Ошибка создания заказа: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Внутренняя ошибка при создании заказа",
        )


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(default=1, ge=1, description="Номер страницы"),
    page_size: int = Query(default=20, ge=1, le=100, description="Размер страницы"),
    user: dict[str, Any] = Depends(get_current_user),
):
    """
    Получить список заказов.
    Клиент видит только свои заказы, админ — все.
    """
    is_admin = (
        user.get("role") == "admin"
        or user.get("app_metadata", {}).get("role") == "admin"
    )

    result = await get_user_orders(
        user_id=user["id"],
        page=page,
        page_size=page_size,
        is_admin=is_admin,
    )

    return OrderListResponse(
        items=[_format_order(o) for o in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user: dict[str, Any] = Depends(get_current_user),
):
    """
    Получить детали заказа по ID.
    Клиент может видеть только свой заказ, админ — любой.
    """
    is_admin = (
        user.get("role") == "admin"
        or user.get("app_metadata", {}).get("role") == "admin"
    )

    # Админ может видеть любой заказ, клиент — только свой
    user_id = None if is_admin else user["id"]
    order = await get_order_by_id(order_id, user_id=user_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Заказ {order_id} не найден",
        )

    return _format_order(order)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    admin: dict[str, Any] = Depends(require_admin),
):
    """
    Обновить статус заказа.
    Доступно только администратору. Отправляет уведомление в Telegram.
    """
    updated_order = await service_update_status(
        order_id=order_id,
        new_status=status_update.status.value,
        comment=status_update.comment,
    )

    if not updated_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Заказ {order_id} не найден",
        )

    # Отправляем уведомление о смене статуса
    try:
        await notify_status_change(updated_order, status_update.status.value)
    except Exception as e:
        logger.error(f"Ошибка отправки уведомления о статусе: {e}")

    return _format_order(updated_order)


def _format_order(order: dict) -> OrderResponse:
    """Вспомогательная функция: преобразование данных заказа в схему ответа."""
    return OrderResponse(
        id=order["id"],
        user_id=order.get("user_id", ""),
        status=order.get("status", "pending"),
        total_amount=float(order.get("total_amount", 0)),
        deposit_amount=float(order.get("deposit_amount", 0)),
        deposit_paid=order.get("deposit_paid", False),
        delivery_address=order.get("delivery_address", ""),
        comment=order.get("comment", ""),
        phone=order.get("phone", ""),
        items=[
            OrderItemResponse(
                id=item.get("id", ""),
                product_id=item.get("product_id", ""),
                product_name=item.get("product_name", ""),
                quantity=int(item.get("quantity", 0)),
                price=float(item.get("price", 0)),
                subtotal=float(item.get("subtotal", 0)),
            )
            for item in order.get("items", [])
        ],
        created_at=order.get("created_at"),
        updated_at=order.get("updated_at"),
    )
