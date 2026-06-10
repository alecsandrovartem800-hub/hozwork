"""
API роутер для платежей (payments).
Mock-реализация депозитных платежей с placeholder для реального шлюза.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_db, get_current_user
from app.schemas.payment import (
    DepositPaymentRequest,
    DepositPaymentResponse,
    PaymentStatus,
    PaymentStatusEnum,
)
from app.services.deposit import process_deposit_payment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Платежи"])


# ============================================================
# PLACEHOLDER: Интеграция с реальным платёжным шлюзом
#
# Stripe:
#   pip install stripe
#   stripe.api_key = settings.PAYMENT_GATEWAY_KEY
#   intent = stripe.PaymentIntent.create(
#       amount=int(amount * 100),  # в копейках
#       currency='rub',
#       metadata={'order_id': order_id},
#   )
#
# YooKassa:
#   pip install yookassa
#   from yookassa import Configuration, Payment
#   Configuration.account_id = settings.YOOKASSA_SHOP_ID
#   Configuration.secret_key = settings.PAYMENT_GATEWAY_KEY
#   payment = Payment.create({
#       "amount": {"value": str(amount), "currency": "RUB"},
#       "confirmation": {"type": "redirect", "return_url": "..."},
#       "capture": True,
#       "metadata": {"order_id": order_id},
#   })
# ============================================================


@router.post("/deposit", response_model=DepositPaymentResponse)
async def create_deposit_payment(
    payment: DepositPaymentRequest,
    user: dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Оплата залога за заказ (mock).
    
    В production — подключить реальный платёжный шлюз (Stripe/YooKassa).
    Текущая реализация всегда возвращает успех.
    """
    # Проверяем существование заказа
    order_response = (
        db.table("orders")
        .select("*")
        .eq("id", payment.order_id)
        .execute()
    )
    if not order_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Заказ {payment.order_id} не найден",
        )

    order = order_response.data[0]

    # Проверяем что заказ принадлежит пользователю
    if order["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому заказу",
        )

    # Проверяем что залог ещё не оплачен
    if order.get("deposit_paid"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Залог уже оплачен для этого заказа",
        )

    # Обрабатываем mock-платёж
    try:
        result = await process_deposit_payment(payment.amount, payment.order_id)
    except Exception as e:
        logger.error(f"Ошибка обработки платежа: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Ошибка обработки платежа",
        )

    # Сохраняем запись о платеже
    now = datetime.now(timezone.utc).isoformat()
    payment_record = {
        "id": str(uuid.uuid4()),
        "order_id": payment.order_id,
        "amount": payment.amount,
        "status": result["status"],
        "payment_provider_id": result["payment_provider_id"],
        "payment_method": payment.payment_method,
        "created_at": now,
    }

    try:
        db.table("deposits").insert(payment_record).execute()
    except Exception as e:
        logger.error(f"Ошибка записи платежа в БД: {e}")

    # Обновляем статус заказа
    if result["status"] == "success":
        db.table("orders").update({
            "deposit_paid": True,
            "deposit_amount": payment.amount,
            "status": "deposit_paid",
            "updated_at": now,
        }).eq("id", payment.order_id).execute()

    logger.info(
        f"Депозитный платёж: order={payment.order_id}, "
        f"amount={payment.amount:.2f} ₽, status={result['status']}"
    )

    return DepositPaymentResponse(
        id=payment_record["id"],
        order_id=payment.order_id,
        amount=payment.amount,
        status=PaymentStatusEnum(result["status"]),
        payment_provider_id=result["payment_provider_id"],
        payment_method=payment.payment_method,
        message=result.get("message", ""),
        created_at=now,
    )


@router.get("/deposit/{order_id}", response_model=PaymentStatus)
async def check_deposit_status(
    order_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Проверить статус оплаты залога для заказа.
    """
    # Проверяем что заказ существует и принадлежит пользователю
    order_response = (
        db.table("orders")
        .select("user_id, deposit_paid, deposit_amount")
        .eq("id", order_id)
        .execute()
    )
    if not order_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Заказ {order_id} не найден",
        )

    order = order_response.data[0]

    # Проверяем доступ (админ или владелец)
    is_admin = (
        user.get("role") == "admin"
        or user.get("app_metadata", {}).get("role") == "admin"
    )
    if not is_admin and order["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому заказу",
        )

    # Получаем последний платёж для заказа
    deposit_response = (
        db.table("deposits")
        .select("*")
        .eq("order_id", order_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if deposit_response.data:
        deposit = deposit_response.data[0]
        return PaymentStatus(
            order_id=order_id,
            payment_id=deposit.get("id", ""),
            status=PaymentStatusEnum(deposit.get("status", "pending")),
            amount=float(deposit.get("amount", 0)),
            paid_at=deposit.get("created_at"),
            message="Платёж найден",
        )
    else:
        return PaymentStatus(
            order_id=order_id,
            status=PaymentStatusEnum.PENDING,
            amount=float(order.get("deposit_amount", 0)),
            message="Платёж не найден — залог ожидает оплаты",
        )
