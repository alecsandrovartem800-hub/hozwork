"""
Бизнес-логика депозитных платежей.
Mock-реализация для разработки с возможностью подключения реального шлюза.
"""

import logging
import uuid
from datetime import datetime, timezone

from app.core.config import settings

logger = logging.getLogger(__name__)


def calculate_deposit(items: list[dict]) -> float:
    """
    Расчёт суммы залога на основе товаров в заказе.
    Формула: sum(price * quantity * deposit_percent / 100) для каждого товара.
    
    Args:
        items: Список товаров с полями price, quantity, deposit_percent
        
    Returns:
        Итоговая сумма залога в рублях
    """
    total_deposit = 0.0
    for item in items:
        price = float(item.get("price", 0))
        quantity = int(item.get("quantity", 1))
        deposit_percent = float(item.get("deposit_percent", 30.0))

        item_deposit = price * quantity * deposit_percent / 100
        total_deposit += item_deposit

        logger.debug(
            f"Товар {item.get('name', '?')}: "
            f"{price} ₽ × {quantity} × {deposit_percent}% = {item_deposit:.2f} ₽"
        )

    logger.info(f"Общая сумма залога: {total_deposit:.2f} ₽")
    return round(total_deposit, 2)


async def process_deposit_payment(amount: float, order_id: str) -> dict:
    """
    Обработка платежа залога.
    
    Mock-реализация: всегда возвращает успех.
    В production заменить на интеграцию со Stripe/YooKassa.
    
    Args:
        amount: Сумма залога в рублях
        order_id: ID заказа
        
    Returns:
        Словарь с данными платежа (payment_provider_id, status, etc.)
    """
    # ========================================
    # TODO: Интеграция с реальным платёжным шлюзом
    # Stripe: stripe.PaymentIntent.create(amount=int(amount*100), currency='rub')
    # YooKassa: Payment.create({amount: {value: amount, currency: 'RUB'}, ...})
    # ========================================

    if settings.PAYMENT_GATEWAY_KEY == "mock":
        # Mock-платёж — всегда успешный
        payment_id = f"mock_pay_{uuid.uuid4().hex[:12]}"

        logger.info(
            f"[MOCK] Депозитный платёж обработан: "
            f"order_id={order_id}, amount={amount:.2f} ₽, "
            f"payment_id={payment_id}"
        )

        return {
            "payment_provider_id": payment_id,
            "status": "success",
            "amount": amount,
            "order_id": order_id,
            "payment_method": "mock_card",
            "message": "Mock-платёж успешно обработан",
            "paid_at": datetime.now(timezone.utc).isoformat(),
        }

    # Placeholder для реального шлюза
    raise NotImplementedError(
        f"Платёжный шлюз '{settings.PAYMENT_GATEWAY_KEY}' не реализован. "
        "Используйте PAYMENT_GATEWAY_KEY=mock для тестирования."
    )


async def refund_deposit(payment_provider_id: str, amount: float) -> dict:
    """
    Возврат залога.
    Mock-реализация.
    
    Args:
        payment_provider_id: ID платежа у провайдера
        amount: Сумма возврата
        
    Returns:
        Данные о возврате
    """
    if settings.PAYMENT_GATEWAY_KEY == "mock":
        refund_id = f"mock_refund_{uuid.uuid4().hex[:12]}"

        logger.info(
            f"[MOCK] Возврат депозита: "
            f"payment_id={payment_provider_id}, amount={amount:.2f} ₽, "
            f"refund_id={refund_id}"
        )

        return {
            "refund_id": refund_id,
            "payment_provider_id": payment_provider_id,
            "amount": amount,
            "status": "refunded",
            "message": "Mock-возврат успешно обработан",
        }

    raise NotImplementedError("Возврат через реальный шлюз не реализован")
