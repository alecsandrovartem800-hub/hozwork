# Inspired by anthropics/skills (document processing)
"""
Модуль генерации PDF-счетов для HOZWORK.

Создаёт PDF-документ с информацией о заказе: шапка HOZWORK,
таблица товаров, итоги, оплаченный залог, QR-код с номером заказа.
Поддерживает русский язык.
"""

from __future__ import annotations

import io
from datetime import datetime
from typing import Any

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

try:
    import qrcode  # type: ignore[import-untyped]

    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False

# Фирменные цвета HOZWORK
_GREEN_DARK = colors.HexColor("#2E7D32")
_GREEN_MED = colors.HexColor("#4CAF50")
_GREEN_LIGHT = colors.HexColor("#E8F5E9")
_GRAY = colors.HexColor("#F5F5F5")


def _register_fonts() -> str:
    """Регистрирует шрифт с поддержкой кириллицы (если доступен).

    Пробуем найти DejaVuSans или Arial в стандартных путях Windows.
    Если шрифты недоступны — используем встроенный Helvetica.

    Returns:
        Имя зарегистрированного шрифта.
    """
    if not HAS_REPORTLAB:
        return "Helvetica"

    import os

    # Пути к шрифтам с поддержкой кириллицы
    font_candidates = [
        ("DejaVuSans", os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "DejaVuSans.ttf")),
        ("Arial", os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "arial.ttf")),
        ("Tahoma", os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "tahoma.ttf")),
        ("Calibri", os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "calibri.ttf")),
    ]

    for font_name, font_path in font_candidates:
        if os.path.exists(font_path):
            try:
                pdfmetrics.registerFont(TTFont(font_name, font_path))
                return font_name
            except Exception:
                continue

    return "Helvetica"


def _generate_qr_image(data: str) -> Any | None:
    """Генерирует QR-код как ReportLab-совместимое изображение.

    Args:
        data: Строка для кодирования (например, номер заказа).

    Returns:
        ReportLab Image объект или None, если qrcode недоступен.
    """
    if not HAS_QRCODE or not HAS_REPORTLAB:
        return None

    from reportlab.platypus import Image as RLImage

    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    img_buffer = io.BytesIO()
    img.save(img_buffer, format="PNG")
    img_buffer.seek(0)

    return RLImage(img_buffer, width=30 * mm, height=30 * mm)


def generate_invoice(order_data: dict[str, Any]) -> bytes:
    """Генерирует PDF-счёт (инвойс) для заказа HOZWORK.

    Бизнес-логика:
    - Шапка с логотипом/названием HOZWORK
    - Информация о заказе: номер, дата, email покупателя
    - Таблица товаров: наименование, кол-во, цена за ед., итого
    - Блок итогов: общая сумма, залог, остаток к оплате
    - QR-код с номером заказа для быстрого сканирования

    Args:
        order_data: Данные заказа::

            {
                "order_id": str,
                "customer_email": str,
                "date": str (ISO format),
                "items": [
                    {"name": str, "qty": int, "price": float},
                    …
                ],
                "total": float,
                "deposit": float
            }

    Returns:
        PDF-документ в виде bytes.

    Raises:
        ImportError: Если ReportLab не установлен.
        ValueError: Если отсутствуют обязательные поля.
    """
    if not HAS_REPORTLAB:
        raise ImportError(
            "Для генерации PDF необходим reportlab. "
            "Установите: pip install reportlab"
        )

    # Валидация входных данных
    required_fields = ["order_id", "items", "total"]
    for field in required_fields:
        if field not in order_data:
            raise ValueError(f"Отсутствует обязательное поле: {field}")

    order_id = str(order_data["order_id"])
    customer_email = order_data.get("customer_email", "—")
    order_date = order_data.get("date", datetime.now().strftime("%Y-%m-%d"))
    items = order_data["items"]
    total = float(order_data["total"])
    deposit = float(order_data.get("deposit", 0))
    remaining = total - deposit

    # Регистрация кириллического шрифта
    font_name = _register_fonts()

    # Создаём PDF в буфер
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    # Стили
    styles = getSampleStyleSheet()
    style_title = ParagraphStyle(
        "HozTitle",
        parent=styles["Title"],
        fontName=font_name,
        fontSize=22,
        textColor=_GREEN_DARK,
        spaceAfter=6 * mm,
    )
    style_subtitle = ParagraphStyle(
        "HozSubtitle",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=11,
        textColor=colors.gray,
    )
    style_normal = ParagraphStyle(
        "HozNormal",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=10,
    )
    style_bold = ParagraphStyle(
        "HozBold",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=11,
        textColor=_GREEN_DARK,
    )

    # Собираем элементы документа
    elements: list[Any] = []

    # ── Шапка ──
    elements.append(Paragraph("HOZWORK", style_title))
    elements.append(
        Paragraph("Хозяйственные товары — оптом и в розницу", style_subtitle)
    )
    elements.append(Spacer(1, 8 * mm))

    # ── Информация о заказе ──
    info_data = [
        [
            Paragraph(f"<b>Заказ №:</b> {order_id}", style_normal),
            Paragraph(f"<b>Дата:</b> {order_date}", style_normal),
        ],
        [
            Paragraph(f"<b>Покупатель:</b> {customer_email}", style_normal),
            Paragraph("", style_normal),
        ],
    ]
    info_table = Table(info_data, colWidths=[90 * mm, 80 * mm])
    info_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    elements.append(info_table)
    elements.append(Spacer(1, 6 * mm))

    # ── Таблица товаров ──
    header = [
        Paragraph("<b>№</b>", style_normal),
        Paragraph("<b>Наименование</b>", style_normal),
        Paragraph("<b>Кол-во</b>", style_normal),
        Paragraph("<b>Цена</b>", style_normal),
        Paragraph("<b>Сумма</b>", style_normal),
    ]
    table_data = [header]

    for idx, item in enumerate(items, 1):
        name = item.get("name", "—")
        qty = int(item.get("qty", 1))
        price = float(item.get("price", 0))
        line_total = qty * price
        table_data.append(
            [
                Paragraph(str(idx), style_normal),
                Paragraph(str(name), style_normal),
                Paragraph(str(qty), style_normal),
                Paragraph(f"{price:,.2f} P", style_normal),
                Paragraph(f"{line_total:,.2f} P", style_normal),
            ]
        )

    item_table = Table(
        table_data, colWidths=[12 * mm, 80 * mm, 20 * mm, 30 * mm, 30 * mm]
    )
    item_table.setStyle(
        TableStyle(
            [
                # Шапка таблицы
                ("BACKGROUND", (0, 0), (-1, 0), _GREEN_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), font_name),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                # Данные
                ("FONTNAME", (0, 1), (-1, -1), font_name),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("ALIGN", (2, 1), (-1, -1), "CENTER"),
                # Чередующийся фон строк
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _GRAY]),
                # Линии
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#BDBDBD")),
                ("LINEBELOW", (0, 0), (-1, 0), 1.5, _GREEN_DARK),
                # Отступы
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(item_table)
    elements.append(Spacer(1, 6 * mm))

    # ── Итоги ──
    totals_data = [
        ["", "", "", Paragraph("<b>Итого:</b>", style_bold), Paragraph(f"<b>{total:,.2f} P</b>", style_bold)],
        ["", "", "", Paragraph("Залог оплачен:", style_normal), Paragraph(f"{deposit:,.2f} P", style_normal)],
        ["", "", "", Paragraph("<b>Остаток к оплате:</b>", style_bold), Paragraph(f"<b>{remaining:,.2f} P</b>", style_bold)],
    ]
    totals_table = Table(
        totals_data, colWidths=[12 * mm, 80 * mm, 20 * mm, 30 * mm, 30 * mm]
    )
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEABOVE", (3, 0), (-1, 0), 1, _GREEN_DARK),
            ]
        )
    )
    elements.append(totals_table)
    elements.append(Spacer(1, 10 * mm))

    # ── QR-код ──
    qr_image = _generate_qr_image(f"HOZWORK-ORDER-{order_id}")
    if qr_image is not None:
        qr_data = [
            [qr_image, Paragraph(f"Заказ #{order_id}", style_normal)],
        ]
        qr_table = Table(qr_data, colWidths=[35 * mm, 100 * mm])
        qr_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (1, 0), (1, 0), 5 * mm),
                ]
            )
        )
        elements.append(qr_table)
        elements.append(Spacer(1, 5 * mm))

    # ── Футер ──
    elements.append(
        Paragraph(
            "Спасибо за покупку в HOZWORK! Данный документ сформирован автоматически.",
            style_subtitle,
        )
    )

    # Собираем PDF
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
