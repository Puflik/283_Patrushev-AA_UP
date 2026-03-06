-- ================================================================
--  Файл: 004_queries.sql — Рабочие запросы под каждый экран UI
--  Используются в Tauri-приложении (через tauri-plugin-sql)
-- ================================================================


-- ================================================================
-- ЭКРАН: Авторизация / Логин
-- ================================================================

-- Q1: Проверка логина и пароля (возвращает пользователя с ролью)
SELECT
    u.id,
    u.username,
    u.email,
    u.session_timeout,
    r.name        AS role_name,
    r.display_name AS role_display
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE (u.username = $1 OR u.email = $1)
  AND u.password_hash = crypt($2, u.password_hash)
  AND u.is_active = TRUE;

-- Q2: Обновить дату последнего входа
UPDATE users SET last_login_at = NOW() WHERE id = $1;

-- Q3: Создать токен сброса пароля (Шаг 1 — Email)
UPDATE users
SET password_reset_token   = encode(gen_random_bytes(32), 'hex'),
    password_reset_expires = NOW() + INTERVAL '15 minutes'
WHERE email = $1 AND is_active = TRUE
RETURNING password_reset_token;

-- Q4: Проверить токен сброса (Шаг 2 — Токен)
SELECT id FROM users
WHERE password_reset_token = $1
  AND password_reset_expires > NOW();

-- Q5: Установить новый пароль (Шаг 3 — Новый пароль)
UPDATE users
SET password_hash          = crypt($2, gen_salt('bf', 12)),
    password_reset_token   = NULL,
    password_reset_expires = NULL,
    updated_at             = NOW()
WHERE id = $1;

-- Q6: Обновить пароль из Настроек безопасности
UPDATE users
SET password_hash = crypt($2, gen_salt('bf', 12)),
    updated_at    = NOW()
WHERE id = $1
  AND password_hash = crypt($3, password_hash);  -- проверяем текущий пароль

-- Q7: Обновить таймаут сессии (Настройки → Сессии и доступ)
UPDATE users SET session_timeout = $2, updated_at = NOW() WHERE id = $1;


-- ================================================================
-- ЭКРАН: Главная — Журнал событий системы + Уведомления
-- ================================================================

-- Q8: Последние N событий аудита для Главного экрана
SELECT
    al.occurred_at,
    al.status,
    al.details,
    u.username
FROM audit_log al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.occurred_at DESC
LIMIT 20;

-- Q9: Непрочитанные уведомления для текущей роли
SELECT id, title, message, type, created_at
FROM notifications
WHERE is_read = FALSE
  AND (target_role_id IS NULL OR target_role_id = $1)
ORDER BY created_at DESC;

-- Q10: Пометить уведомление прочитанным
UPDATE notifications SET is_read = TRUE WHERE id = $1;


-- ================================================================
-- ЭКРАН: Управление сотрудниками
-- ================================================================

-- Q11: Список всех активных сотрудников (с поиском)
SELECT
    e.id,
    e.badge_number,
    e.first_name,
    e.last_name,
    e.middle_name,
    e.position,
    e.department,
    e.phone,
    e.is_active,
    u.username,
    r.display_name AS role_display
FROM employees e
LEFT JOIN users u ON u.id = e.user_id
LEFT JOIN roles r ON r.id = u.role_id
WHERE e.is_active = TRUE
  AND ($1 IS NULL OR
       e.last_name ILIKE '%' || $1 || '%' OR
       e.first_name ILIKE '%' || $1 || '%' OR
       e.badge_number ILIKE '%' || $1 || '%')
ORDER BY e.last_name, e.first_name;

-- Q12: Список администраторов (кнопка "Админы")
SELECT
    u.id,
    u.username,
    u.email,
    e.first_name,
    e.last_name,
    e.position,
    r.display_name AS role_display
FROM users u
JOIN roles r ON r.id = u.role_id
LEFT JOIN employees e ON e.user_id = u.id
WHERE r.name = 'admin'
ORDER BY u.username;

-- Q13: Добавить нового сотрудника
INSERT INTO employees (first_name, last_name, middle_name, position, department, phone, badge_number, hired_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id;

-- Q14: Деактивировать сотрудника (не удалять — сохраняем историю)
UPDATE employees
SET is_active  = FALSE,
    fired_at   = NOW(),
    updated_at = NOW()
WHERE id = $1;

-- Q15: Время прихода/ухода сотрудника сегодня (для карточки)
SELECT
    direction,
    occurred_at,
    confidence
FROM access_log
WHERE employee_id = $1
  AND occurred_at::date = CURRENT_DATE
ORDER BY occurred_at DESC;


-- ================================================================
-- ЭКРАН: Транспортные средства (Автомобили)
-- ================================================================

-- Q16: Список всех ТС с поиском по госномеру или модели
SELECT
    v.id,
    v.license_plate,
    v.brand,
    v.model,
    v.vehicle_type,
    v.year,
    v.color,
    v.vin,
    v.status,
    v.entry_type,
    v.is_allowed,
    COALESCE(e.last_name || ' ' || e.first_name, 'Водитель не назначен') AS driver_name
FROM vehicles v
LEFT JOIN employees e ON e.id = v.owner_id
WHERE ($1 IS NULL OR
       v.license_plate ILIKE '%' || $1 || '%' OR
       v.model         ILIKE '%' || $1 || '%' OR
       v.brand         ILIKE '%' || $1 || '%')
ORDER BY v.license_plate;

-- Q17: Добавить автомобиль
INSERT INTO vehicles (license_plate, brand, model, vehicle_type, year, color, vin, owner_id, entry_type)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id;

-- Q18: Обновить данные автомобиля
UPDATE vehicles
SET brand = $2, model = $3, vehicle_type = $4, year = $5,
    color = $6, vin = $7, owner_id = $8, status = $9,
    is_allowed = $10, updated_at = NOW()
WHERE id = $1;

-- Q19: Удалить автомобиль
DELETE FROM vehicles WHERE id = $1;

-- Q20: Проверка госномера при распознавании (ИИ → СКУД)
SELECT
    v.id,
    v.license_plate,
    v.brand,
    v.model,
    v.is_allowed,
    v.status,
    v.entry_type,
    COALESCE(e.last_name || ' ' || e.first_name, NULL) AS driver_name
FROM vehicles v
LEFT JOIN employees e ON e.id = v.owner_id
WHERE v.license_plate = $1;


-- ================================================================
-- ЭКРАН: Система видеонаблюдения (Камеры)
-- ================================================================

-- Q21: Список всех камер с фильтром
SELECT
    id,
    name,
    location,
    camera_type,
    model,
    ip_address::TEXT,
    resolution,
    fps,
    description,
    status,
    purpose,
    stream_url
FROM cameras
WHERE ($1 IS NULL OR
       name     ILIKE '%' || $1 || '%' OR
       location ILIKE '%' || $1 || '%')
ORDER BY name;

-- Q22: Добавить камеру
INSERT INTO cameras (name, location, camera_type, model, ip_address, resolution, fps, description, purpose, stream_url)
VALUES ($1, $2, $3, $4, $5::INET, $6, $7, $8, $9, $10)
RETURNING id;

-- Q23: Обновить статус камеры
UPDATE cameras SET status = $2, updated_at = NOW() WHERE id = $1;

-- Q24: Удалить камеру
DELETE FROM cameras WHERE id = $1;


-- ================================================================
-- ЭКРАН: Журнал событий системы (аудит)
-- ================================================================

-- Q25: Журнал аудита с фильтрами (Все пользователи / Все действия / Все ресурсы)
SELECT
    al.id,
    al.occurred_at,
    al.action,
    al.resource,
    al.details,
    al.status,
    al.severity,
    al.ip_address::TEXT,
    u.username,
    r.display_name AS user_role
FROM audit_log al
LEFT JOIN users u ON u.id = al.user_id
LEFT JOIN roles r ON r.id = u.role_id
WHERE ($1::INTEGER IS NULL OR al.user_id = $1)          -- фильтр: пользователь
  AND ($2 IS NULL OR al.action = $2)                    -- фильтр: действие
  AND ($3 IS NULL OR al.resource = $3)                  -- фильтр: ресурс
  AND ($4::TIMESTAMPTZ IS NULL OR al.occurred_at >= $4) -- фильтр: дата с
  AND ($5::TIMESTAMPTZ IS NULL OR al.occurred_at <= $5) -- фильтр: дата по
ORDER BY al.occurred_at DESC
LIMIT 50 OFFSET $6;

-- Q26: Счётчики для карточек статистики аудита (1,248 / 23 / 156 / 89%)
SELECT
    COUNT(*)                                                      AS total_events,
    COUNT(*) FILTER (WHERE severity = 'critical')                 AS critical_events,
    COUNT(*) FILTER (WHERE status = 'warning')                    AS warnings,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'success')::NUMERIC
        / NULLIF(COUNT(*), 0) * 100, 0
    )                                                             AS success_percent
FROM audit_log
WHERE ($1::TIMESTAMPTZ IS NULL OR occurred_at >= $1)
  AND ($2::TIMESTAMPTZ IS NULL OR occurred_at <= $2);

-- Q27: Журнал событий доступа СКУД (приходы/уходы)
SELECT
    al.id,
    al.occurred_at,
    al.event_type,
    al.direction,
    al.recognized_data,
    al.confidence,
    al.is_success,
    COALESCE(e.last_name || ' ' || e.first_name, '—') AS employee_name,
    v.license_plate,
    c.name AS camera_name
FROM access_log al
LEFT JOIN employees e ON e.id = al.employee_id
LEFT JOIN vehicles  v ON v.id = al.vehicle_id
LEFT JOIN cameras   c ON c.id = al.camera_id
WHERE ($1::INTEGER IS NULL OR al.employee_id = $1)    -- только свои события (для роли employee)
ORDER BY al.occurred_at DESC
LIMIT 100 OFFSET $2;

-- Q28: Записать событие доступа (вызывается из Python-модуля ИИ)
INSERT INTO access_log
    (event_type, direction, employee_id, vehicle_id, camera_id, recognized_data, confidence, is_success, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id;

-- Q29: Записать событие аудита (вызывается при любом действии пользователя)
INSERT INTO audit_log (user_id, action, resource, resource_id, details, status, severity, ip_address)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::INET)
RETURNING id;


-- ================================================================
-- ДАШБОРД — Статистика для главного экрана
-- ================================================================

-- Q30: Сколько человек пришло/ушло сегодня
SELECT
    COUNT(*) FILTER (WHERE direction = 'in'  AND is_success = TRUE) AS arrived_today,
    COUNT(*) FILTER (WHERE direction = 'out' AND is_success = TRUE) AS left_today,
    COUNT(*) FILTER (WHERE is_success = FALSE)                       AS denied_today
FROM access_log
WHERE occurred_at::date = CURRENT_DATE;

-- Q31: Статистика по типам событий за последние 7 дней (для графика)
SELECT
    occurred_at::date AS event_date,
    event_type,
    COUNT(*) AS cnt
FROM access_log
WHERE occurred_at >= NOW() - INTERVAL '7 days'
GROUP BY event_date, event_type
ORDER BY event_date, event_type;

-- Q32: Проверка прав доступа пользователя к ресурсу
SELECT
    p.can_view,
    p.can_create,
    p.can_edit,
    p.can_delete,
    p.can_export
FROM permissions p
JOIN users u ON u.role_id = p.role_id
WHERE u.id = $1
  AND p.resource = $2;

