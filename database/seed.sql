-- ============================================
-- SPORT LOUNGE — Seed Data
-- ============================================

-- ============================================
-- TOBACCO BRANDS
-- ============================================
INSERT INTO public.tobacco_brands (name, country, sort_order) VALUES
    ('Darkside', 'Россия', 1),
    ('Tangiers', 'США', 2),
    ('Fumari', 'США', 3),
    ('Must Have', 'Россия', 4),
    ('Daily Hookah', 'Россия', 5),
    ('Element', 'Россия', 6),
    ('Spectrum', 'Россия', 7),
    ('BlackBurn', 'Россия', 8)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TOBACCO FLAVORS
-- ============================================
INSERT INTO public.tobacco_flavors (brand_id, name, description, category, stock_grams, min_threshold_grams) VALUES
    (1, 'Grape Core', 'Насыщенный виноград с кислинкой', 'fruity', 450, 100),
    (1, 'Supernova', 'Мятный холод с ментолом', 'mint', 300, 100),
    (1, 'Falling Star', 'Манго и маракуйя', 'exotic', 200, 100),
    (1, 'Polar Cream', 'Сливочная мята', 'mint', 350, 100),
    (1, 'Generis Raspberry', 'Спелая малина', 'berry', 180, 100),
    (1, 'Cosmos Flower', 'Цветочный микс с жасмином', 'floral', 250, 100),
    (2, 'Cane Mint', 'Легендарная мята', 'mint', 400, 100),
    (2, 'Maraschino Cherry', 'Коктейльная вишня', 'berry', 150, 100),
    (2, 'Kashmir Peach', 'Пряный персик', 'fruity', 280, 100),
    (2, 'Orange Soda', 'Апельсиновая газировка', 'citrus', 200, 100),
    (3, 'Blueberry Muffin', 'Черничный маффин', 'sweet', 500, 100),
    (3, 'Lemon Mint', 'Лимон с мятой', 'citrus', 380, 100),
    (3, 'White Gummy Bear', 'Мармеладный мишка', 'sweet', 420, 100),
    (3, 'Tropical Punch', 'Тропический пунш', 'exotic', 300, 100),
    (4, 'Pinkman', 'Грейпфрут, клубника, малина', 'berry', 550, 100),
    (4, 'Mango', 'Сочное манго', 'exotic', 400, 100),
    (4, 'Margarita', 'Коктейль Маргарита', 'citrus', 200, 100),
    (4, 'Space Flavour', 'Космический микс', 'exotic', 320, 100),
    (5, 'Клубничный Джем', 'Домашний клубничный джем', 'berry', 300, 100),
    (5, 'Дыня Кренделёк', 'Сладкая дыня с выпечкой', 'sweet', 250, 100),
    (5, 'Личи', 'Экзотический личи', 'exotic', 180, 100),
    (6, 'Pineapple', 'Спелый ананас', 'fruity', 400, 100),
    (6, 'Watermelon Holls', 'Арбуз с холодком', 'fruity', 350, 100),
    (6, 'Banana Daiquiri', 'Банановый дайкири', 'sweet', 280, 100),
    (6, 'Kiwi', 'Сочный киви', 'fruity', 200, 100),
    (7, 'Caribbean Rum', 'Карибский ром', 'classic', 300, 100),
    (7, 'Green Apple', 'Зелёное яблоко', 'fruity', 450, 100),
    (7, 'Chocolate', 'Молочный шоколад', 'sweet', 200, 100),
    (8, 'Juicy Peach', 'Сочный персик', 'fruity', 380, 100),
    (8, 'Haribon', 'Жевательные мишки Haribo', 'sweet', 300, 100),
    (8, 'Something Berry', 'Ягодный микс', 'berry', 250, 100)
ON CONFLICT (brand_id, name) DO NOTHING;

-- ============================================
-- LIQUIDS (base for hookah)
-- ============================================
INSERT INTO public.liquids (name, description, icon, sort_order) VALUES
    ('Вода', 'Классическая вода — чистый вкус табака', '💧', 1),
    ('Молоко', 'Молоко — мягкий и сливочный дым', '🥛', 2),
    ('Сок', 'Фруктовый сок — дополнительная сладость', '🧃', 3),
    ('Вино', 'Красное вино — для ценителей', '🍷', 4),
    ('Лёд + Вода', 'Ледяная вода — охлаждённый дым', '🧊', 5),
    ('Энергетик', 'Энергетик — яркий и бодрящий', '⚡', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ATMOSPHERE SETTINGS (defaults)
-- ============================================
INSERT INTO public.atmosphere_settings (setting_key, setting_value, setting_type, label, description, options, sort_order) VALUES
    ('music_genre', 'lounge', 'select', 'Жанр музыки', 'Фоновая музыка в зале', '["lounge", "jazz", "deep_house", "chill", "r&b", "ambient"]', 1),
    ('music_volume', '40', 'number', 'Громкость музыки', 'Уровень громкости от 0 до 100', '{"min": 0, "max": 100}', 2),
    ('lighting_mode', 'warm', 'select', 'Режим освещения', 'Цветовая схема освещения', '["warm", "cool", "neon", "candle", "rgb_party", "minimal"]', 3),
    ('lighting_brightness', '60', 'number', 'Яркость света', 'Уровень яркости от 0 до 100', '{"min": 0, "max": 100}', 4),
    ('ac_temperature', '22', 'number', 'Температура кондиционера', 'Температура в градусах Цельсия', '{"min": 16, "max": 30}', 5),
    ('aroma_diffuser', 'true', 'boolean', 'Аромадиффузор', 'Включить/выключить аромадиффузор', null, 6),
    ('aroma_scent', 'vanilla', 'select', 'Аромат диффузора', 'Выбранный аромат', '["vanilla", "lavender", "citrus", "ocean", "forest", "none"]', 7),
    ('welcome_message', 'Добро пожаловать в SPORT LOUNGE! 🌿', 'text', 'Приветственное сообщение', 'Текст на экране при входе', null, 8)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- SMART FEATURES (default toggles)
-- ============================================
INSERT INTO public.smart_features (feature_key, label, description, is_enabled, config, sort_order) VALUES
    ('auto_assign', 'Авто-назначение мастера', 'Автоматически назначать свободного мастера на новый заказ', true, '{}', 1),
    ('auto_cancel', 'Авто-отмена зависших', 'Автоматически отменять заказы без активности более 30 минут', true, '{"timeout_minutes": 30}', 2),
    ('auto_restock', 'Авто-заявки на табак', 'Автоматически создавать заявки при снижении остатков ниже порога', true, '{}', 3),
    ('hide_empty', 'Скрывать пустые вкусы', 'Автоматически скрывать вкусы с нулевым остатком из меню', true, '{}', 4),
    ('queue_estimation', 'Расчёт времени ожидания', 'Показывать гостям расчётное время ожидания при очереди', true, '{"avg_prep_minutes": 15}', 5),
    ('telegram_orders', 'Telegram-уведомления о заказах', 'Отправлять карточки заказов в Telegram-бот', true, '{}', 6),
    ('telegram_support', 'Telegram-поддержка', 'Принимать сообщения от гостей через Telegram-бот поддержки', true, '{}', 7),
    ('kpi_snapshots', 'Ежедневные KPI', 'Автоматически сохранять снимок KPI каждый день в полночь', true, '{}', 8),
    ('loyalty', 'Система лояльности', 'Начисление кэшбэка и скидок постоянным клиентам', true, '{}', 9),
    ('referrals', 'Реферальная программа', 'Бонусы за приглашение новых гостей', false, '{}', 10),
    ('ai_mixologist', 'ИИ-миксолог', 'Генерация умных миксов на основе предпочтений и запасов табака', true, '{}', 11),
    ('cookie_banner', 'Cookie-баннер', 'Отображение всплывающего cookie-уведомления при первом входе', true, '{}', 12),
    ('push_notifications', 'Push-уведомления', 'Отправка push-уведомлений в браузер об изменении статуса заказа', false, '{}', 13)
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================
-- DEFAULT MASTERS
-- ============================================
INSERT INTO public.masters (name, status) VALUES
    ('Алексей', 'free'),
    ('Дмитрий', 'free'),
    ('Камиль', 'offline');
