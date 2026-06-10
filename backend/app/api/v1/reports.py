"""
API роутер для генерации отчетов, накладных в PDF, SEO и A/B тестирования (reports).
Интегрирован со скиллами docs/pdf_generator, writing/seo_description и marketing/ab_test.
"""

import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from pydantic import BaseModel, Field

from app.api.deps import get_db, require_admin, get_current_user
from app.skills.docs.pdf_generator import generate_invoice
from app.skills.writing.seo_description import generate_seo_description
from app.skills.marketing.ab_test import record_event, get_test_results

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Отчёты, Документы, Маркетинг"])

class ABTestEventRequest(BaseModel):
    test_id: str = Field(..., description="ID A/B теста")
    variant: str = Field(..., description="Вариант (A/B/Control)")
    converted: bool = Field(..., description="Была ли конверсия")

@router.get("/invoice/{order_id}")
async def get_order_invoice_pdf(
    order_id: str,
    db=Depends(get_db),
    user=Depends(get_current_user),  # Клиент может скачать свой инвойс, админ — любой
):
    """
    Сгенерировать и скачать PDF накладную/счет для заказа.
    Использует модуль docs/pdf_generator на ReportLab.
    """
    try:
        # Загружаем детали заказа
        order_resp = db.table("orders").select("*").eq("id", order_id).execute()
        if not order_resp.data:
            raise HTTPException(status_code=404, detail="Заказ не найден")
            
        order_data = order_resp.data[0]
        
        # Проверяем права доступа: либо админ, либо владелец заказа
        # Supabase JWT payload содержит 'sub' как ID пользователя
        user_id = user.get("sub")
        # Также роль проверяется из JWT или базы
        is_admin = user.get("app_metadata", {}).get("role") == "admin"
        
        # Если не админ, проверяем, совпадает ли user_id
        if not is_admin and order_data["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет доступа к документам этого заказа"
            )
            
        # Загружаем позиции заказа с названиями товаров
        items_resp = (
            db.table("order_items")
            .select("quantity, price, products(name)")
            .eq("order_id", order_id)
            .execute()
        )
        
        # Форматируем данные для PDF
        items_formatted = []
        for item in items_resp.data:
            product = item.get("products", {})
            items_formatted.append({
                "name": product.get("name", "Товар без названия") if product else "Удаленный товар",
                "quantity": int(item["quantity"]),
                "price": float(item["price"])
            })
            
        pdf_input = {
            "order_id": order_data["id"],
            "customer_email": order_data.get("email") or user.get("email") or "client@hozwork.ru",
            "date": order_data.get("created_at") or order_data.get("date") or "",
            "items": items_formatted,
            "total_amount": float(order_data["total_amount"]),
            "deposit_amount": float(order_data["deposit_amount"]),
        }
        
        # Генерация PDF
        pdf_bytes = generate_invoice(pdf_input)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{order_id[:8]}.pdf"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка генерации PDF счета: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка сервера при генерации документа: {str(e)}"
        )

@router.get("/seo/{product_id}")
async def get_product_seo_description(
    product_id: str,
    db=Depends(get_db),
    admin=Depends(require_admin), # SEO-генератор обычно нужен контент-менеджеру/админу
):
    """
    Сгенерировать оптимизированное под поисковые системы (SEO) описание для карточки товара.
    Использует модуль writing/seo_description на базе шаблонов.
    """
    try:
        # Загружаем товар
        product_resp = db.table("products").select("*").eq("id", product_id).single().execute()
        if not product_resp.data:
            raise HTTPException(status_code=404, detail="Товар не найден")
            
        p = product_resp.data
        
        # Готовим свойства для SEO генератора
        properties = {
            "бренд": p.get("brand") or "Россия",
            "артикул": p.get("sku") or "HOZ-MOCK",
        }
        if p.get("weight"):
            properties["вес"] = f"{p['weight']} кг"
            
        seo_data = generate_seo_description(
            name=p["name"],
            category=p.get("category") or "Хозяйственные товары",
            price=float(p["price"]),
            properties=properties
        )
        return seo_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка SEO генерации: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка сервера при SEO генерации: {str(e)}"
        )

@router.post("/ab-test")
async def record_ab_test_event(
    event: ABTestEventRequest,
):
    """
    Зарегистрировать клик или конверсию в рамках проводимого A/B тестирования.
    Использует in-memory хранилище модуля marketing/ab_test.
    """
    try:
        record_event(event.test_id, event.variant, event.converted)
        return {"status": "success", "message": "Событие успешно зарегистрировано"}
    except Exception as e:
        logger.error(f"Ошибка записи A/B события: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка сервера: {str(e)}"
        )

@router.get("/ab-test/{test_id}/results")
async def get_ab_test_results(
    test_id: str,
    admin=Depends(require_admin),
):
    """
    Получить статистические результаты A/B теста (хи-квадрат анализ, доверительный интервал).
    Использует модуль marketing/ab_test.
    """
    try:
        results = get_test_results(test_id)
        return results
    except Exception as e:
        logger.error(f"Ошибка расчета результатов A/B теста: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка расчета: {str(e)}"
        )
