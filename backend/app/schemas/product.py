"""
Схемы данных для товаров (products).
Pydantic v2 модели для валидации входных/выходных данных.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    """Создание нового товара."""

    # Название товара (обязательное)
    name: str = Field(..., min_length=1, max_length=500, description="Название товара")
    # Описание товара
    description: str = Field(default="", max_length=5000, description="Описание товара")
    # Цена в рублях
    price: float = Field(..., gt=0, description="Цена товара в рублях")
    # Категория товара
    category: str = Field(default="", max_length=200, description="Категория товара")
    # URL изображения товара
    image_url: str = Field(default="", description="URL изображения товара")
    # Количество на складе
    stock: int = Field(default=0, ge=0, description="Остаток на складе")
    # Процент залога (от цены)
    deposit_percent: float = Field(
        default=30.0, ge=0, le=100, description="Процент залога от цены"
    )
    # Активен ли товар (показывать в каталоге)
    is_active: bool = Field(default=True, description="Показывать в каталоге")
    # SKU — артикул товара
    sku: str = Field(default="", max_length=100, description="Артикул товара")
    # Вес в кг
    weight: float | None = Field(default=None, ge=0, description="Вес товара в кг")
    # Бренд товара
    brand: str = Field(default="", max_length=200, description="Бренд товара")


class ProductUpdate(BaseModel):
    """Обновление существующего товара (все поля опциональны)."""

    name: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=5000)
    price: float | None = Field(default=None, gt=0)
    category: str | None = Field(default=None, max_length=200)
    image_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    deposit_percent: float | None = Field(default=None, ge=0, le=100)
    is_active: bool | None = None
    sku: str | None = Field(default=None, max_length=100)
    weight: float | None = Field(default=None, ge=0)
    brand: str | None = Field(default=None, max_length=200)


class ProductResponse(BaseModel):
    """Ответ с данными товара."""

    id: str
    name: str
    description: str = ""
    price: float
    category: str = ""
    image_url: str = ""
    stock: int = 0
    deposit_percent: float = 30.0
    is_active: bool = True
    sku: str = ""
    weight: float | None = None
    brand: str = ""
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    """Ответ со списком товаров и пагинацией."""

    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
