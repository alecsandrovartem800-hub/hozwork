"""
Telegram Bot API — отправка уведомлений о заказах.
Использует httpx для асинхронных HTTP-запросов к Telegram Bot API.
"""

import logging
from datetime import datetime

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Base URL для Telegram Bot API
TELEGRAM_API_BASE = "https://api.telegram.org/bot{token}"


def _get_api_url(method: str) -> str:
    """Сформировать URL для вызова метода Telegram Bot API."""
    return f"{TELEGRAM_API_BASE.format(token=settings.TELEGRAM_BOT_TOKEN)}/{method}"


async def send_message(
    chat_id: str,
    text: str,
    parse_mode: str = "HTML",
) -> dict | None:
    """
    Отправить сообщение через Telegram Bot API.
    Возвращает ответ API или None при ошибке.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN не задан, уведомление пропущено")
        return None

    if not chat_id:
        logger.warning("chat_id не задан, уведомление пропущено")
        return None

    url = _get_api_url("sendMessage")
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            logger.info(f"Telegram сообщение отправлено в чат {chat_id}")
            return result
    except httpx.HTTPStatusError as e:
        logger.error(f"Telegram API ошибка: {e.response.status_code} — {e.response.text}")
        return None
    except httpx.RequestError as e:
        logger.error(f"Ошибка при отправке в Telegram: {e}")
        return None


async def send_order_notification(order_data: dict) -> dict | None:
    """
    Отправить уведомление о новом заказе в Telegram.
    Форматирует данные заказа в читаемое HTML-сообщение.
    """
    chat_id = settings.TELEGRAM_CHAT_ID
    if not chat_id:
        logger.warning("TELEGRAM_CHAT_ID не задан, уведомление о заказе пропущено")
        return None

    # Формируем список товаров
    items_text = ""
    for item in order_data.get("items", []):
        name = item.get("product_name", "Товар")
        qty = item.get("quantity", 1)
        price = item.get("price", 0)
        items_text += f"  • {name} × {qty} = {price * qty:.2f} ₽\n"

    if not items_text:
        items_text = "  • (нет данных)\n"

    # Форматируем дату
    created_at = order_data.get("created_at", "")
    if isinstance(created_at, datetime):
        date_str = created_at.strftime("%d.%m.%Y %H:%M")
    else:
        date_str = str(created_at)[:19] if created_at else datetime.now().strftime("%d.%m.%Y %H:%M")

    # Сообщение о новом заказе
    message = (
        f"📦 <b>Новый заказ #{order_data.get('id', '—')[:8]}</b>\n\n"
        f"👤 Клиент: {order_data.get('email', 'Не указан')}\n"
        f"📱 Телефон: {order_data.get('phone', 'Не указан')}\n\n"
        f"🛒 <b>Товары:</b>\n{items_text}\n"
        f"💰 Сумма: <b>{order_data.get('total_amount', 0):.2f} ₽</b>\n"
        f"💳 Залог: <b>{order_data.get('deposit_amount', 0):.2f} ₽</b> (оплачен)\n\n"
        f"🏠 Адрес: {order_data.get('delivery_address', 'Не указан')}\n"
        f"💬 Комментарий: {order_data.get('comment', '—')}\n\n"
        f"📅 Дата: {date_str}"
    )

    return await send_message(chat_id, message)


async def send_status_update(order_data: dict, new_status: str) -> dict | None:
    """
    Отправить уведомление об изменении статуса заказа.
    """
    chat_id = settings.TELEGRAM_CHAT_ID
    if not chat_id:
        logger.warning("TELEGRAM_CHAT_ID не задан, уведомление о статусе пропущено")
        return None

    # Статусы на русском для отображения
    status_labels = {
        "pending": "⏳ Ожидает обработки",
        "deposit_paid": "💳 Залог оплачен",
        "processing": "⚙️ В обработке",
        "shipped": "🚚 Отправлен",
        "delivered": "📬 Доставлен",
        "completed": "✅ Завершён",
        "cancelled": "❌ Отменён",
        "refunded": "↩️ Возврат средств",
    }

    status_text = status_labels.get(new_status, new_status)

    message = (
        f"🔄 <b>Изменение статуса заказа</b>\n\n"
        f"📦 Заказ: #{order_data.get('id', '—')[:8]}\n"
        f"👤 Клиент: {order_data.get('email', 'Не указан')}\n"
        f"📊 Новый статус: {status_text}\n\n"
        f"💰 Сумма: {order_data.get('total_amount', 0):.2f} ₽"
    )

    return await send_message(chat_id, message)


async def register_chat_id(update: dict) -> str | None:
    """
    Обработка команды /start для автоматической регистрации chat_id.
    Извлекает chat_id из объекта update Telegram.
    """
    try:
      message = update.get("message", {})
      text = message.get("text", "")

      if text.strip() == "/start":
        chat_id = str(message.get("chat", {}).get("id", ""))
        if chat_id:
          # Сохраняем в настройках в памяти
          settings.TELEGRAM_CHAT_ID = chat_id
          logger.info(f"Зарегистрирован новый chat_id: {chat_id}")

          # Отправляем приветственное сообщение
          await send_message(
            chat_id,
            "✅ <b>HOZWORK Bot активирован!</b>\n\n"
            "Вы будете получать уведомления о новых заказах.\n"
            f"Ваш chat_id: <code>{chat_id}</code>\n\n"
            "Бот готов к отправке уведомлений!",
          )
          return chat_id
    except Exception as e:
      logger.error(f"Ошибка при регистрации chat_id: {e}")
    return None


import asyncio

async def telegram_polling_loop():
    """
    Фоновый цикл длинных опросов (polling) для Telegram Bot API.
    Позволяет боту отвечать без настройки вебхуков.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN не задан, фоновый опрос пропущен")
        return

    logger.info("Запуск фонового опроса Telegram Bot...")
    offset = 0
    url = _get_api_url("getUpdates")

    async with httpx.AsyncClient(timeout=15.0) as client:
        while True:
            try:
                response = await client.get(
                    url, 
                    params={"offset": offset, "timeout": 10},
                    timeout=15.0
                )
                if response.status_code == 200:
                    updates = response.json().get("result", [])
                    for update in updates:
                        offset = update["update_id"] + 1
                        await register_chat_id(update)
            except Exception as e:
                logger.error(f"Ошибка в цикле опроса Telegram: {e}")
            await asyncio.sleep(1)

