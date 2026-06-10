"""
Схемы данных для заказов (orders).
Pydantic v2 модели для создания и отображения заказов.
"""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class OrderStatusEnum(str, Enum):
    """Статусы заказа."""

    PENDING = "pending"              # Ожидает обработки
    DEPOSIT_PAID = "deposit_paid"    # Залог оплачен
    PROCESSING = "processing"        # В обработке
    SHIPPED = "shipped"              # Отправлен
    DELIVERED = "delivered"          # Доставлен
    COMPLETED = "completed"          # Завершён
    CANCELLED = "cancelled"          # Отменён
    REFUNDED = "refunded"           # Возврат средств


class OrderItemCreate(BaseModel):
    """Элемент заказа при создании."""

    # ID товара из каталога
    product_id: str = Field(..., description="ID товара")
    # Количество единиц
    quantity: int = Field(..., gt=0, description="Количество")


class OrderCreate(BaseModel):
    """Создание нового заказа."""

    # Список товаров в заказе
    items: list[OrderItemCreate] = Field(
        ..., min_length=1, description="Список товаров для заказа"
    )
    # Адрес доставки
    delivery_address: str = Field(
        default="", max_length=1000, description="Адрес доставки"
    )
    # Комментарий к заказу
    comment: str = Field(
        default="", max_length=2000, description="Комментарий к заказу"
    )
    # Телефон для связи
    phone: str = Field(
        default="", max_length=20, description="Телефон для связи"
    )


class OrderItemResponse(BaseModel):
    """Элемент заказа в ответе."""

    id: str
    product_id: str
    product_name: str = ""
    quantity: int
    price: float  # Цена за единицу на момент заказа
    subtotal: float  # quantity * price

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    """Полный ответ с данными заказа."""

    id: str
    user_id: str
    status: str
    total_amount: float          # Общая сумма заказа
    deposit_amount: float        # Сумма залога
    deposit_paid: bool = False   # Залог оплачен
    delivery_address: str = ""
    comment: str = ""
    phone: str = ""
    items: list[OrderItemResponse] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    """Обновление статуса заказа (админ)."""

    status: OrderStatusEnum = Field(..., description="Новый статус заказа")
    comment: str = Field(
        default="", max_length=1000, description="Комментарий к смене статуса"
    )


class OrderListResponse(BaseModel):
    """Список заказов с пагинацией."""

    items: list[OrderResponse]
    total: int
    page: int
    page_size: int
