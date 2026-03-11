-- ================================================================
--  СКУД — Система контроля и управления доступом
--  СУБД: PostgreSQL 15+
--  Файл: 001_schema.sql v2 — Обновлённая схема БД
--  Изменения от 07.03:
--    - vehicles: entry_type/is_allowed → allowed_gates
--    - vehicles: убрана привязка к классификатору ТС
--    - employees: убран face_encoding (распознавание лиц не используется)
--    - access_log: добавлен gate_id (номер ворот)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- 1. РОЛИ ПОЛЬЗОВАТЕЛЕЙ (RBAC)
-- ================================================================
CREATE TABLE roles (
    id           SERIAL      PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Роли пользователей системы (RBAC)';

-- ================================================================
-- 2. ПРАВА ДОСТУПА
-- ================================================================
CREATE TABLE permissions (
    id         SERIAL      PRIMARY KEY,
    role_id    INTEGER     NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource   VARCHAR(50) NOT NULL,
    can_view   BOOLEAN     NOT NULL DEFAULT FALSE,
    can_create BOOLEAN     NOT NULL DEFAULT FALSE,
    can_edit   BOOLEAN     NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN     NOT NULL DEFAULT FALSE,
    can_export BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE(role_id, resource)
);

COMMENT ON TABLE permissions IS 'Права доступа ролей к ресурсам системы';

-- ================================================================
-- 3. ПОЛЬЗОВАТЕЛИ СИСТЕМЫ
-- ================================================================
CREATE TABLE users (
    id                     SERIAL       PRIMARY KEY,
    username               VARCHAR(50)  NOT NULL UNIQUE,
    email                  VARCHAR(150) NOT NULL UNIQUE,
    password_hash          TEXT         NOT NULL,
    role_id                INTEGER      NOT NULL REFERENCES roles(id),
    is_active              BOOLEAN      NOT NULL DEFAULT TRUE,
    session_timeout        INTEGER      NOT NULL DEFAULT 30,
    last_login_at          TIMESTAMPTZ,
    password_reset_token   TEXT,
    password_reset_expires TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Пользователи системы управления СКУД';
COMMENT ON COLUMN users.session_timeout IS 'Таймаут сессии в минутах';

-- ================================================================
-- 4. СОТРУДНИКИ ПРЕДПРИЯТИЯ
--    Примечание: face_encoding убран — распознавание лиц исключено
--    из архитектуры, доступ только по номерному знаку + БД
-- ================================================================
CREATE TABLE employees (
    id          SERIAL       PRIMARY KEY,
    user_id     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    position    VARCHAR(150),
    department  VARCHAR(150),
    phone       VARCHAR(20),
    photo_path  TEXT,
    badge_number VARCHAR(20) UNIQUE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    hired_at    DATE,
    fired_at    DATE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE employees IS 'Сотрудники предприятия';
COMMENT ON COLUMN employees.photo_path IS 'Путь к фото сотрудника (для карточки, не для ИИ)';

-- ================================================================
-- 5. ТРАНСПОРТНЫЕ СРЕДСТВА
--    allowed_gates определяет через какие ворота может въезжать ТС
--    Решение о въезде принимает БД, не ИИ-классификатор
-- ================================================================
CREATE TABLE vehicles (
    id            SERIAL       PRIMARY KEY,
    license_plate VARCHAR(20)  NOT NULL UNIQUE,
    brand         VARCHAR(50)  NOT NULL,
    model         VARCHAR(50)  NOT NULL,
    vehicle_type  VARCHAR(30)  NOT NULL,
    -- Седан | Внедорожник | Минивэн | Грузовик | Автобус | Мотоцикл | Спецтехника
    year          INTEGER      CHECK (year BETWEEN 1900 AND 2100),
    color         VARCHAR(30),
    vin           VARCHAR(17)  UNIQUE,
    owner_id      INTEGER      REFERENCES employees(id) ON DELETE SET NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'maintenance', 'blocked')),
    allowed_gates VARCHAR(10)  NOT NULL DEFAULT 'all'
                  CHECK (allowed_gates IN ('gate_1', 'gate_2', 'all', 'none')),
    -- gate_1 — только ворота №1 (легковой въезд)
    -- gate_2 — только ворота №2 (грузовой въезд)
    -- all    — через любые ворота
    -- none   — заблокирован везде
    notes         TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vehicles IS 'Транспортные средства, допущенные к въезду на территорию';
COMMENT ON COLUMN vehicles.license_plate IS 'Госномер (распознаётся YOLOv11 + PaddleOCR)';
COMMENT ON COLUMN vehicles.allowed_gates IS 'Разрешённые ворота: gate_1 | gate_2 | all | none';

-- ================================================================
-- 6. КАМЕРЫ ВИДЕОНАБЛЮДЕНИЯ
-- ================================================================
CREATE TABLE cameras (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    location    VARCHAR(150) NOT NULL,
    camera_type VARCHAR(30)  NOT NULL,
    model       VARCHAR(100),
    ip_address  INET         UNIQUE,
    resolution  VARCHAR(20),
    fps         INTEGER      CHECK (fps BETWEEN 1 AND 120),
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'online'
                CHECK (status IN ('online', 'offline', 'maintenance')),
    gate_number VARCHAR(10)  -- к каким воротам привязана: 'gate_1' | 'gate_2' | NULL
                CHECK (gate_number IN ('gate_1', 'gate_2') OR gate_number IS NULL),
    purpose     VARCHAR(30)  NOT NULL DEFAULT 'plate'
                CHECK (purpose IN ('plate', 'general')),
    -- plate   — распознавание номерных знаков (основная задача)
    -- general — общий обзор территории
    stream_url  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cameras IS 'Камеры видеонаблюдения системы СКУД';
COMMENT ON COLUMN cameras.gate_number IS 'Ворота к которым привязана камера';
COMMENT ON COLUMN cameras.purpose IS 'Назначение: plate — номерные знаки, general — обзор';

-- ================================================================
-- 7. ЖУРНАЛ СОБЫТИЙ ДОСТУПА (СКУД)
-- ================================================================
CREATE TABLE access_log (
    id              BIGSERIAL    PRIMARY KEY,
    event_type      VARCHAR(20)  NOT NULL
                    CHECK (event_type IN ('plate', 'manual', 'denied')),
    -- plate  — распознавание номера (основной тип)
    -- manual — ручной пропуск охранником
    -- denied — отказ в доступе
    direction       VARCHAR(10)  NOT NULL DEFAULT 'in'
                    CHECK (direction IN ('in', 'out')),
    vehicle_id      INTEGER      REFERENCES vehicles(id) ON DELETE SET NULL,
    camera_id       INTEGER      REFERENCES cameras(id) ON DELETE SET NULL,
    gate_number     VARCHAR(10)  CHECK (gate_number IN ('gate_1', 'gate_2') OR gate_number IS NULL),
    recognized_plate TEXT,       -- что распознал ИИ (сырой текст до поиска в БД)
    detect_confidence NUMERIC(5,2), -- уверенность YOLOv11 при детекции 0–100%
    ocr_confidence  NUMERIC(5,2),   -- уверенность PaddleOCR при чтении текста 0–100%
    is_success      BOOLEAN      NOT NULL DEFAULT TRUE,
    deny_reason     TEXT,        -- причина отказа: 'not_found' | 'blocked' | 'wrong_gate'
    notes           TEXT,
    occurred_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE access_log IS 'Журнал событий въезда/выезда — основная таблица СКУД';
COMMENT ON COLUMN access_log.recognized_plate IS 'Номер распознанный ИИ (может отличаться от БД при ошибке OCR)';
COMMENT ON COLUMN access_log.deny_reason IS 'not_found — нет в БД, blocked — заблокирован, wrong_gate — не те ворота';

-- ================================================================
-- 8. ЖУРНАЛ АУДИТА СИСТЕМЫ
-- ================================================================
CREATE TABLE audit_log (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50)  NOT NULL,
    resource    VARCHAR(50),
    resource_id INTEGER,
    details     TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'info'
                CHECK (status IN ('success', 'info', 'warning', 'error')),
    severity    VARCHAR(20)  NOT NULL DEFAULT 'info'
                CHECK (severity IN ('info', 'warning', 'critical')),
    ip_address  INET,
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Журнал аудита действий пользователей';

-- ================================================================
-- 9. УВЕДОМЛЕНИЯ СИСТЕМЫ
-- ================================================================
CREATE TABLE notifications (
    id             SERIAL      PRIMARY KEY,
    title          VARCHAR(200) NOT NULL,
    message        TEXT,
    type           VARCHAR(20)  NOT NULL DEFAULT 'info'
                   CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
    target_role_id INTEGER      REFERENCES roles(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Уведомления для отображения на главном экране';

-- ================================================================
-- 10. ИНДЕКСЫ
-- ================================================================
CREATE INDEX idx_access_log_occurred    ON access_log(occurred_at DESC);
CREATE INDEX idx_access_log_vehicle     ON access_log(vehicle_id);
CREATE INDEX idx_access_log_camera      ON access_log(camera_id);
CREATE INDEX idx_access_log_gate        ON access_log(gate_number);
CREATE INDEX idx_access_log_type        ON access_log(event_type);
CREATE INDEX idx_access_log_plate       ON access_log(recognized_plate);

CREATE INDEX idx_audit_log_occurred     ON audit_log(occurred_at DESC);
CREATE INDEX idx_audit_log_user         ON audit_log(user_id);
CREATE INDEX idx_audit_log_action       ON audit_log(action);

CREATE INDEX idx_employees_active       ON employees(is_active);
CREATE INDEX idx_employees_name         ON employees(last_name, first_name);

CREATE INDEX idx_vehicles_plate         ON vehicles(license_plate);
CREATE INDEX idx_vehicles_status        ON vehicles(status);
CREATE INDEX idx_vehicles_gates         ON vehicles(allowed_gates);

CREATE INDEX idx_cameras_status         ON cameras(status);
CREATE INDEX idx_cameras_gate           ON cameras(gate_number);
