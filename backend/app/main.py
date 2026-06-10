"""
Главный файл FastAPI-приложения HOZWORK.
Настройка CORS, подключение роутеров, WebSocket-чата и обработка событий.
"""

import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import products, orders, payments

# Инициализация логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")

# Импортируем другие роутеры, когда они будут созданы
try:
    from app.api.v1 import analytics, recommendations, reports
    app.include_router(analytics.router, prefix="/api/v1")
    app.include_router(recommendations.router, prefix="/api/v1")
    app.include_router(reports.router, prefix="/api/v1")
except ImportError as e:
    logger.warning(f"Не удалось импортировать дополнительные роутеры: {e}")

# Хранилище активных WebSocket соединений
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Новое WS подключение. Всего клиентов: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WS клиент отключился. Осталось клиентов: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Ошибка отправки WS сообщения: {e}")

manager = ConnectionManager()

@app.websocket("/ws/chat/{order_id}")
async def websocket_endpoint(websocket: WebSocket, order_id: str):
    """
    WebSocket эндпоинт для чата по конкретному заказу.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Здесь можно обрабатывать входящие сообщения, сохранять в БД
            # и пересылать всем участникам
            await manager.broadcast(f"Заказ {order_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Ошибка в WebSocket сессии: {e}")
        manager.disconnect(websocket)

import asyncio

@app.on_event("startup")
async def startup_event():
    logger.info(f"Запуск сервера {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Запускаем фоновый цикл опроса Telegram Bot
    try:
        from app.services.telegram import telegram_polling_loop
        asyncio.create_task(telegram_polling_loop())
        logger.info("Фоновая задача Telegram Bot успешно запущена.")
    except Exception as e:
        logger.error(f"Не удалось запустить фоновую задачу Telegram Bot: {e}")


@app.get("/")
async def health_check():
    """Эндпоинт проверки работоспособности (Health Check)"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION
    }
