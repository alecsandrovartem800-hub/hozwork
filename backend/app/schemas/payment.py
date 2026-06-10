"""
Схемы данных для платежей (payments).
Pydantic v2 модели для депозитных платежей.
"""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class PaymentStatusEnum(str, Enum):
    """Статусы платежа."""

    PENDING = "pending"          # Ожидает оплаты
    SUCCESS = "success"          # Успешно оплачен
    FAILED = "failed"           # Ошибка оплаты
    REFUNDED = "refunded"       # Возвращён
    CANCELLED = "cancelled"     # Отменён


class DepositPaymentRequest(BaseModel):
    """Запрос на оплату залога."""

    # ID заказа для привязки платежа
    order_id: str = Field(..., description="ID заказа")
    # Сумма залога в рублях
    amount: float = Field(..., gt=0, description="Сумма залога в рублях")
    # Способ оплаты (для будущей интеграции)
    payment_method: str = Field(
        default="card", description="Способ оплаты: card, sbp, qr"
    )
    # Email для чека
    email: str = Field(default="", description="Email для отправки чека")


class DepositPaymentResponse(BaseModel):
    """Ответ после обработки платежа залога."""

    id: str                              # ID записи платежа
    order_id: str                        # ID заказа
    amount: float                        # Сумма платежа
    status: PaymentStatusEnum            # Статус платежа
    payment_provider_id: str = ""        # ID от платёжного провайдера (mock)
    payment_method: str = "card"
    message: str = ""                    # Сообщение (успех/ошибка)
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class PaymentStatus(BaseModel):
    """Проверка статуса платежа."""

    order_id: str
    payment_id: str = ""
    status: PaymentStatusEnum
    amount: float = 0.0
    paid_at: datetime | None = None
    message: str = ""
