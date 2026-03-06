-- ================================================================
--  СКУД — Система контроля и управления доступом
--  СУБД: PostgreSQL 15+
--  Файл: 001_schema.sql — Создание схемы БД
--  Описание: Полная схема под приложение my-tauri-app
-- ================================================================

-- Включаем расширение для UUID и хэширования паролей
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- 1. РОЛИ ПОЛЬЗОВАТЕЛЕЙ (RBAC)
--    Экран: Авторизация (демо: Администратор, Модератор, Пользователь)
-- ================================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,  -- 'admin' | 'moderator' | 'employee'
    display_name VARCHAR(100) NOT NULL,         -- 'Администратор' | 'Модератор' | 'Сотрудник'
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Роли пользователей системы (RBAC)';
COMMENT ON COLUMN roles.name IS 'Системное имя роли (латиница)';
COMMENT ON COLUMN roles.display_name IS 'Отображаемое имя роли в интерфейсе';

-- ================================================================
-- 2. ПРАВА ДОСТУПА
--    Определяет что каждая роль может делать с каждым разделом
-- ================================================================
CREATE TABLE permissions (
    id          SERIAL PRIMARY KEY,
    role_id     INTEGER      NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource    VARCHAR(50)  NOT NULL,  -- 'employees' | 'vehicles' | 'cameras' | 'audit_log' | 'settings'
    can_view    BOOLEAN      NOT NULL DEFAULT FALSE,
    can_create  BOOLEAN      NOT NULL DEFAULT FALSE,
    can_edit    BOOLEAN      NOT NULL DEFAULT FALSE,
    can_delete  BOOLEAN      NOT NULL DEFAULT FALSE,
    can_export  BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE(role_id, resource)
);

COMMENT ON TABLE permissions IS 'Права доступа ролей к ресурсам системы';
COMMENT ON COLUMN permissions.resource IS 'Раздел системы: employees, vehicles, cameras, audit_log, settings';

-- ================================================================
-- 3. ПОЛЬЗОВАТЕЛИ СИСТЕМЫ
--    Экран: Авторизация, Управление сотрудниками (список Админов)
-- ================================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,            -- bcrypt hash
    role_id         INTEGER      NOT NULL REFERENCES roles(id),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    session_timeout INTEGER      NOT NULL DEFAULT 30,  -- минуты (Настройки → Безопасность)
    last_login_at   TIMESTAMPTZ,
    password_reset_token  TEXT,                        -- токен для сброса пароля
    password_reset_expires TIMESTAMPTZ,               -- срок действия токена
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Пользователи системы управления СКУД';
COMMENT ON COLUMN users.session_timeout IS 'Таймаут сессии в минутах (настраивается в разделе Настройки)';
COMMENT ON COLUMN users.password_reset_token IS 'Токен сброса пароля (3 шага: Email → Токен → Новый пароль)';

-- ================================================================
-- 4. СОТРУДНИКИ ПРЕДПРИЯТИЯ
--    Экран: Управление сотрудниками — список, добавить/удалить
--    Связаны с пользователем системы (user_id может быть NULL —
--    сотрудник есть, но доступа в систему нет)
-- ================================================================
CREATE TABLE employees (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    middle_name     VARCHAR(100),
    position        VARCHAR(150),                   -- должность
    department      VARCHAR(150),                   -- отдел
    phone           VARCHAR(20),
    photo_path      TEXT,                           -- путь к фото для распознавания лиц
    face_encoding   BYTEA,                          -- вектор лица (бинарный, от face_recognition)
    badge_number    VARCHAR(20)  UNIQUE,            -- номер пропуска
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    hired_at        DATE,
    fired_at        DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE employees IS 'Сотрудники предприятия';
COMMENT ON COLUMN employees.face_encoding IS 'Бинарный вектор лица от библиотеки face_recognition (numpy array → bytes)';
COMMENT ON COLUMN employees.photo_path IS 'Путь к эталонному фото сотрудника для ИИ-распознавания';

-- ================================================================
-- 5. ТРАНСПОРТНЫЕ СРЕДСТВА
--    Экран: Автомобили — госномер, модель, VIN, тип, статус, водитель
-- ================================================================
CREATE TABLE vehicles (
    id              SERIAL PRIMARY KEY,
    license_plate   VARCHAR(20)  NOT NULL UNIQUE,   -- госномер: А123БВ777
    brand           VARCHAR(50)  NOT NULL,           -- Toyota
    model           VARCHAR(50)  NOT NULL,           -- Camry
    vehicle_type    VARCHAR(30)  NOT NULL,           -- Седан | Внедорожник | Минивэн | Грузовик
    year            INTEGER,
    color           VARCHAR(30),
    vin             VARCHAR(17)  UNIQUE,             -- VIN 17 символов
    owner_id        INTEGER      REFERENCES employees(id) ON DELETE SET NULL,  -- назначенный водитель
    status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'maintenance', 'blocked')),
                    -- Активен | Обслуживание | Заблокирован
    entry_type      VARCHAR(20)  NOT NULL DEFAULT 'car'
                    CHECK (entry_type IN ('car', 'truck')),  -- въезд легковых или грузовых
    is_allowed      BOOLEAN      NOT NULL DEFAULT TRUE,      -- разрешён въезд
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vehicles IS 'Транспортные средства, допущенные к въезду на территорию';
COMMENT ON COLUMN vehicles.license_plate IS 'Государственный номерной знак (распознаётся ИИ)';
COMMENT ON COLUMN vehicles.entry_type IS 'Тип въезда: car — легковой въезд, truck — грузовой въезд';

-- ================================================================
-- 6. КАМЕРЫ ВИДЕОНАБЛЮДЕНИЯ
--    Экран: Система видеонаблюдения — модель, IP, разрешение, FPS, локация
-- ================================================================
CREATE TABLE cameras (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,           -- Камера въезда | Камера парковки
    location        VARCHAR(150) NOT NULL,           -- Главный въезд | Парковка А | Северная стена
    camera_type     VARCHAR(30)  NOT NULL,           -- Цилиндрическая | Купольная | PTZ (поворотная)
    model           VARCHAR(100),                    -- Hikvision DS-2CD2143G0
    ip_address      INET         UNIQUE,             -- 192.168.1.100
    resolution      VARCHAR(20),                     -- Full HD (1080p) | 4K Ultra HD
    fps             INTEGER,                         -- 30 | 25
    description     TEXT,                            -- Контроль въезда на территорию
    status          VARCHAR(20)  NOT NULL DEFAULT 'online'
                    CHECK (status IN ('online', 'offline', 'maintenance')),
    purpose         VARCHAR(30)  NOT NULL DEFAULT 'face'
                    CHECK (purpose IN ('face', 'plate', 'general')),
                    -- face — распознавание лиц, plate — номера авто, general — общий обзор
    stream_url      TEXT,                            -- RTSP-поток
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cameras IS 'Камеры видеонаблюдения системы СКУД';
COMMENT ON COLUMN cameras.purpose IS 'Назначение камеры: face — распознавание лиц, plate — номерные знаки';
COMMENT ON COLUMN cameras.ip_address IS 'IP-адрес камеры в локальной сети';

-- ================================================================
-- 7. ЖУРНАЛ СОБЫТИЙ ДОСТУПА (СКУД)
--    Экран: Журнал событий — время, сотрудник/авто, камера, результат
-- ================================================================
CREATE TABLE access_log (
    id              BIGSERIAL    PRIMARY KEY,
    event_type      VARCHAR(20)  NOT NULL
                    CHECK (event_type IN ('face', 'plate', 'manual', 'denied')),
                    -- face — по лицу, plate — по номеру, manual — вручную, denied — отказ
    direction       VARCHAR(10)  NOT NULL DEFAULT 'in'
                    CHECK (direction IN ('in', 'out')),  -- вход / выход
    employee_id     INTEGER      REFERENCES employees(id) ON DELETE SET NULL,
    vehicle_id      INTEGER      REFERENCES vehicles(id) ON DELETE SET NULL,
    camera_id       INTEGER      REFERENCES cameras(id) ON DELETE SET NULL,
    recognized_data TEXT,        -- что распознала ИИ-система (номер или имя)
    confidence      NUMERIC(5,2),-- уверенность распознавания 0.00–100.00 %
    is_success      BOOLEAN      NOT NULL DEFAULT TRUE,   -- пропущен / отказано
    notes           TEXT,
    occurred_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE access_log IS 'Журнал событий прохода/въезда — основная таблица СКУД';
COMMENT ON COLUMN access_log.confidence IS 'Точность распознавания ИИ-модели в процентах';
COMMENT ON COLUMN access_log.recognized_data IS 'Данные распознанные ИИ: госномер или ФИО сотрудника';

-- ================================================================
-- 8. ЖУРНАЛ АУДИТА СИСТЕМЫ
--    Экран: Журнал событий системы (Главная + отдельный экран аудита)
--    Логирует действия пользователей: SUCCESS / INFO / ERROR / WARNING
-- ================================================================
CREATE TABLE audit_log (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(50)  NOT NULL,   -- PERMISSION_CHANGE | ACCESS_DENIED | PASSWORD_RESET | LOGIN | LOGOUT
    resource        VARCHAR(50),             -- employees | vehicles | cameras | settings
    resource_id     INTEGER,                 -- ID записи которую изменили
    details         TEXT,                    -- описание: 'Новый автомобиль добавлен: А123ВС789 (Toyota Camry)'
    status          VARCHAR(20)  NOT NULL DEFAULT 'info'
                    CHECK (status IN ('success', 'info', 'warning', 'error')),
    severity        VARCHAR(20)  NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info', 'warning', 'critical')),
    ip_address      INET,                    -- IP пользователя
    occurred_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Журнал аудита действий пользователей в системе';
COMMENT ON COLUMN audit_log.action IS 'Тип действия: PERMISSION_CHANGE, ACCESS_DENIED, PASSWORD_RESET, LOGIN, LOGOUT и др.';

-- ================================================================
-- 9. УВЕДОМЛЕНИЯ СИСТЕМЫ
--    Экран: Главная → блок Уведомления (warning/info баннеры)
-- ================================================================
CREATE TABLE notifications (
    id              SERIAL       PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,    -- 'Требуется обновление ПО'
    message         TEXT,
    type            VARCHAR(20)  NOT NULL DEFAULT 'info'
                    CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    target_role_id  INTEGER      REFERENCES roles(id) ON DELETE CASCADE,
                    -- NULL = для всех, иначе только для этой роли
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Уведомления системы для отображения на главном экране';

-- ================================================================
-- 10. ИНДЕКСЫ для производительности запросов
-- ================================================================

-- Часто фильтруем журнал по времени
CREATE INDEX idx_access_log_occurred   ON access_log(occurred_at DESC);
CREATE INDEX idx_access_log_employee   ON access_log(employee_id);
CREATE INDEX idx_access_log_vehicle    ON access_log(vehicle_id);
CREATE INDEX idx_access_log_camera     ON access_log(camera_id);
CREATE INDEX idx_access_log_type       ON access_log(event_type);

-- Аудит: сортировка по времени, фильтр по пользователю и действию
CREATE INDEX idx_audit_log_occurred    ON audit_log(occurred_at DESC);
CREATE INDEX idx_audit_log_user        ON audit_log(user_id);
CREATE INDEX idx_audit_log_action      ON audit_log(action);
CREATE INDEX idx_audit_log_status      ON audit_log(status);

-- Сотрудники: поиск по имени и активности
CREATE INDEX idx_employees_active      ON employees(is_active);
CREATE INDEX idx_employees_name        ON employees(last_name, first_name);

-- Авто: поиск по госномеру (ИИ-распознавание)
CREATE INDEX idx_vehicles_plate        ON vehicles(license_plate);
CREATE INDEX idx_vehicles_status       ON vehicles(status);

-- Камеры: фильтр по статусу
CREATE INDEX idx_cameras_status        ON cameras(status);
CREATE INDEX idx_cameras_purpose       ON cameras(purpose);

