"""
Многоканальная система уведомлений.
Диспетчер для отправки уведомлений через Telegram, Email (stub) и другие каналы.
"""

import logging

from app.services.telegram import send_order_notification, send_status_update

logger = logging.getLogger(__name__)


async def notify_new_order(order_data: dict) -> None:
    """
    Уведомление о новом заказе по всем каналам.
    
    Каналы:
    - Telegram: отправка форматированного сообщения админу
    - Email: заглушка (логирование)
    """
    # Канал 1: Telegram
    try:
        result = await send_order_notification(order_data)
        if result:
            logger.info(f"Telegram уведомление о заказе {order_data.get('id', '?')} отправлено")
        else:
            logger.warning(f"Telegram уведомление не отправлено (бот не настроен)")
    except Exception as e:
        logger.error(f"Ошибка отправки Telegram уведомления: {e}")

    # Канал 2: Email (заглушка)
    email = order_data.get("email", "")
    if email:
        logger.info(
            f"[EMAIL STUB] Письмо-подтверждение заказа #{order_data.get('id', '?')[:8]} "
            f"отправлено на {email}. "
            f"Сумма: {order_data.get('total_amount', 0):.2f} ₽, "
            f"Залог: {order_data.get('deposit_amount', 0):.2f} ₽"
        )
    else:
        logger.warning("Email клиента не указан, письмо-подтверждение не отправлено")

    # TODO: Канал 3: Push-уведомления (Firebase/OneSignal)
    # TODO: Канал 4: SMS (Twilio/SMS.ru)


async def notify_status_change(order_data: dict, new_status: str) -> None:
    """
    Уведомление об изменении статуса заказа.
    
    Каналы:
    - Telegram: уведомление админу
    - Email: заглушка (уведомление клиенту)
    """
    # Канал 1: Telegram для админа
    try:
        result = await send_status_update(order_data, new_status)
        if result:
            logger.info(
                f"Telegram уведомление о статусе заказа {order_data.get('id', '?')} "
                f"({new_status}) отправлено"
            )
    except Exception as e:
        logger.error(f"Ошибка отправки Telegram уведомления о статусе: {e}")

    # Канал 2: Email клиенту (заглушка)
    email = order_data.get("email", "")
    status_labels = {
        "pending": "Ожидает обработки",
        "deposit_paid": "Залог оплачен",
        "processing": "В обработке",
        "shipped": "Отправлен",
        "delivered": "Доставлен",
        "completed": "Завершён",
        "cancelled": "Отменён",
        "refunded": "Возврат средств",
    }
    status_text = status_labels.get(new_status, new_status)

    if email:
        logger.info(
            f"[EMAIL STUB] Уведомление о смене статуса заказа #{order_data.get('id', '?')[:8]} "
            f"на '{status_text}' отправлено на {email}"
        )


async def notify_abandoned_cart(user_email: str, items: list[dict]) -> None:
    """
    Уведомление о брошенной корзине.
    Email-заглушка с логированием для будущей реализации.
    
    Args:
        user_email: Email пользователя
        items: Список товаров в брошенной корзине
    """
    if not user_email:
        logger.warning("Email не указан, уведомление о брошенной корзине пропущено")
        return

    # Формируем список товаров для лога
    items_summary = ", ".join(
        f"{item.get('name', 'Товар')} (×{item.get('quantity', 1)})"
        for item in items
    )

    logger.info(
        f"[EMAIL STUB] Уведомление о брошенной корзине: "
        f"email={user_email}, товары: {items_summary}. "
        f"Тема: 'Вы забыли товары в корзине HOZWORK!'"
    )

    # TODO: Реализовать реальную отправку email через SendGrid/Mailgun
    # TODO: Добавить задержку перед отправкой (Celery/BackgroundTasks)
    # TODO: A/B тестирование текстов писем
