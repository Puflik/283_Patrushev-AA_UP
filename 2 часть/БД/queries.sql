-- ================================================================
--  СКУД — Файл: 004_queries.sql v2
--  Рабочие SQL-запросы под каждый экран UI
--  Параметры: $1, $2 ... (стиль PostgreSQL / tauri-plugin-sql)
-- ================================================================


-- ================================================================
-- ЭКРАН: Авторизация
-- ================================================================

-- Q1: Проверка логина и пароля
SELECT
    u.id,
    u.username,
    u.email,
    u.session_timeout,
    r.name         AS role_name,
    r.display_name AS role_display
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE (u.username = $1 OR u.email = $1)
  AND u.password_hash = crypt($2, u.password_hash)
  AND u.is_active = TRUE;

-- Q2: Обновить дату последнего входа
UPDATE users
SET last_login_at = NOW()
WHERE id = $1;

-- Q3: Создать токен сброса пароля (Email → токен)
UPDATE users
SET password_reset_token   = encode(gen_random_bytes(32), 'hex'),
    password_reset_expires = NOW() + INTERVAL '15 minutes'
WHERE email = $1
  AND is_active = TRUE
RETURNING password_reset_token;

-- Q4: Проверить токен сброса
SELECT id FROM users
WHERE password_reset_token = $1
  AND password_reset_expires > NOW();

-- Q5: Установить новый пароль
UPDATE users
SET password_hash          = crypt($2, gen_salt('bf', 12)),
    password_reset_token   = NULL,
    password_reset_expires = NULL,
    updated_at             = NOW()
WHERE id = $1;

-- Q6: Изменить пароль из Настроек (требует текущий пароль)
UPDATE users
SET password_hash = crypt($2, gen_salt('bf', 12)),
    updated_at    = NOW()
WHERE id = $1
  AND password_hash = crypt($3, password_hash)
RETURNING id;
-- Если RETURNING вернул 0 строк — текущий пароль неверен

-- Q7: Изменить таймаут сессии
UPDATE users
SET session_timeout = $2,
    updated_at      = NOW()
WHERE id = $1;


-- ================================================================
-- ЭКРАН: Главная — статистика + журнал аудита + уведомления
-- ================================================================

-- Q8: Сводная статистика для дашборда (все цифры за одним запросом)
SELECT
    (SELECT COUNT(*) FROM employees WHERE is_active = TRUE)          AS active_employees,
    (SELECT COUNT(*) FROM vehicles  WHERE status    = 'active')      AS active_vehicles,
    (SELECT COUNT(*) FROM cameras   WHERE status    = 'online')      AS online_cameras,
    (SELECT COUNT(*) FROM access_log
     WHERE occurred_at >= CURRENT_DATE)                              AS events_today,
    (SELECT COUNT(*) FROM access_log
     WHERE occurred_at >= CURRENT_DATE AND is_success = FALSE)       AS denied_today,
    (SELECT COUNT(*) FROM notifications WHERE is_read = FALSE)       AS unread_notifications;

-- Q9: Последние 20 событий аудита для Главного экрана
SELECT
    al.occurred_at,
    al.status,
    al.severity,
    al.action,
    al.details,
    u.username
FROM audit_log al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.occurred_at DESC
LIMIT 20;

-- Q10: Непрочитанные уведомления для текущей роли
SELECT id, title, message, type, created_at
FROM notifications
WHERE is_read = FALSE
  AND (target_role_id IS NULL OR target_role_id = $1)
ORDER BY created_at DESC;

-- Q11: Пометить уведомление прочитанным
UPDATE notifications
SET is_read = TRUE
WHERE id = $1;

-- Q12: Пометить все уведомления прочитанными (для роли)
UPDATE notifications
SET is_read = TRUE
WHERE is_read = FALSE
  AND (target_role_id IS NULL OR target_role_id = $1);


-- ================================================================
-- ЭКРАН: Управление сотрудниками
-- ================================================================

-- Q13: Список сотрудников (с поиском по имени/отделу/должности)
SELECT
    e.id,
    e.badge_number,
    e.last_name,
    e.first_name,
    e.middle_name,
    e.position,
    e.department,
    e.phone,
    e.is_active,
    e.hired_at,
    u.username,
    r.display_name AS role_display,
    -- Количество ТС сотрудника
    COUNT(v.id) AS vehicles_count
FROM employees e
LEFT JOIN users u ON u.id = e.user_id
LEFT JOIN roles r ON r.id = u.role_id
LEFT JOIN vehicles v ON v.owner_id = e.id AND v.status = 'active'
WHERE ($1::TEXT IS NULL
       OR e.last_name  ILIKE '%' || $1 || '%'
       OR e.first_name ILIKE '%' || $1 || '%'
       OR e.department ILIKE '%' || $1 || '%'
       OR e.position   ILIKE '%' || $1 || '%')
GROUP BY e.id, u.username, r.display_name
ORDER BY e.last_name, e.first_name;

-- Q14: Карточка сотрудника
SELECT
    e.*,
    u.username,
    u.email,
    r.display_name AS role_display
FROM employees e
LEFT JOIN users u ON u.id = e.user_id
LEFT JOIN roles r ON r.id = u.role_id
WHERE e.id = $1;

-- Q15: Добавить сотрудника
INSERT INTO employees (first_name, last_name, middle_name, position, department, phone, badge_number, hired_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::DATE)
RETURNING id;

-- Q16: Редактировать сотрудника
UPDATE employees
SET first_name  = $2,
    last_name   = $3,
    middle_name = $4,
    position    = $5,
    department  = $6,
    phone       = $7,
    updated_at  = NOW()
WHERE id = $1;

-- Q17: Деактивировать сотрудника (не удалять — история сохраняется)
UPDATE employees
SET is_active  = FALSE,
    fired_at   = CURRENT_DATE,
    updated_at = NOW()
WHERE id = $1;


-- ================================================================
-- ЭКРАН: Транспортные средства
-- ================================================================

-- Q18: Список ТС (с поиском и фильтром по воротам/статусу)
SELECT
    v.id,
    v.license_plate,
    v.brand,
    v.model,
    v.vehicle_type,
    v.year,
    v.color,
    v.status,
    v.allowed_gates,
    v.notes,
    e.last_name || ' ' || e.first_name AS owner_name,
    e.department                        AS owner_department,
    -- Дата последнего въезда
    (SELECT occurred_at FROM access_log
     WHERE vehicle_id = v.id AND is_success = TRUE
     ORDER BY occurred_at DESC LIMIT 1) AS last_entry
FROM vehicles v
LEFT JOIN employees e ON e.id = v.owner_id
WHERE ($1::TEXT IS NULL
       OR v.license_plate ILIKE '%' || $1 || '%'
       OR v.brand         ILIKE '%' || $1 || '%'
       OR v.model         ILIKE '%' || $1 || '%')
  AND ($2::TEXT IS NULL OR v.status        = $2)
  AND ($3::TEXT IS NULL OR v.allowed_gates = $3)
ORDER BY v.license_plate;

-- Q19: Карточка ТС
SELECT
    v.*,
    e.last_name || ' ' || e.first_name || ' ' || COALESCE(e.middle_name,'') AS owner_full_name,
    e.department,
    e.phone AS owner_phone
FROM vehicles v
LEFT JOIN employees e ON e.id = v.owner_id
WHERE v.id = $1;

-- Q20: Проверка номера при въезде (ГЛАВНЫЙ ЗАПРОС СКУД)
-- $1 = license_plate (распознанный ИИ)
-- $2 = gate_number   ('gate_1' или 'gate_2')
SELECT
    v.id,
    v.license_plate,
    v.brand,
    v.model,
    v.vehicle_type,
    v.allowed_gates,
    v.status,
    COALESCE(e.last_name || ' ' || e.first_name, 'Не назначен') AS driver_name,
    -- Итоговое решение
    CASE
        WHEN v.status != 'active'          THEN FALSE  -- заблокирован/обслуживание
        WHEN v.allowed_gates = 'none'      THEN FALSE  -- запрещён везде
        WHEN v.allowed_gates = 'all'       THEN TRUE   -- разрешён везде
        WHEN v.allowed_gates = $2          THEN TRUE   -- разрешён именно для этих ворот
        ELSE FALSE                                      -- не те ворота
    END AS is_permitted,
    -- Причина отказа (для записи в access_log.deny_reason)
    CASE
        WHEN v.status = 'blocked'          THEN 'blocked'
        WHEN v.status = 'maintenance'      THEN 'blocked'
        WHEN v.allowed_gates = 'none'      THEN 'blocked'
        WHEN v.allowed_gates != 'all'
         AND v.allowed_gates != $2         THEN 'wrong_gate'
        ELSE NULL
    END AS deny_reason
FROM vehicles v
LEFT JOIN employees e ON e.id = v.owner_id
WHERE v.license_plate = $1;
-- Если запрос вернул 0 строк → deny_reason = 'not_found'

-- Q21: Добавить ТС
INSERT INTO vehicles (license_plate, brand, model, vehicle_type, year, color, vin, owner_id, allowed_gates, notes)
VALUES ($1, $2, $3, $4, $5::INTEGER, $6, NULLIF($7,''), $8::INTEGER, $9, NULLIF($10,''))
RETURNING id;

-- Q22: Редактировать ТС
UPDATE vehicles
SET brand         = $2,
    model         = $3,
    vehicle_type  = $4,
    color         = $5,
    allowed_gates = $6,
    status        = $7,
    owner_id      = $8::INTEGER,
    notes         = $9,
    updated_at    = NOW()
WHERE id = $1;

-- Q23: Изменить allowed_gates (быстрое действие из списка)
UPDATE vehicles
SET allowed_gates = $2,
    updated_at    = NOW()
WHERE id = $1
RETURNING license_plate, allowed_gates;

-- Q24: Заблокировать / разблокировать ТС
UPDATE vehicles
SET status     = $2,  -- 'active' | 'blocked' | 'maintenance'
    updated_at = NOW()
WHERE id = $1
RETURNING license_plate, status;


-- ================================================================
-- ЭКРАН: Журнал событий доступа (СКУД)
-- ================================================================

-- Q25: Список событий с фильтрами
SELECT
    al.id,
    al.occurred_at,
    al.event_type,
    al.direction,
    al.gate_number,
    al.recognized_plate,
    al.detect_confidence,
    al.ocr_confidence,
    al.is_success,
    al.deny_reason,
    al.notes,
    v.license_plate  AS vehicle_plate,
    v.brand          AS vehicle_brand,
    v.model          AS vehicle_model,
    c.name           AS camera_name,
    c.location       AS camera_location
FROM access_log al
LEFT JOIN vehicles v  ON v.id  = al.vehicle_id
LEFT JOIN cameras  c  ON c.id  = al.camera_id
WHERE ($1::TIMESTAMPTZ IS NULL OR al.occurred_at >= $1)
  AND ($2::TIMESTAMPTZ IS NULL OR al.occurred_at <= $2)
  AND ($3::TEXT IS NULL OR al.gate_number  = $3)
  AND ($4::TEXT IS NULL OR al.event_type   = $4)
  AND ($5::BOOL IS NULL OR al.is_success   = $5)
  AND ($6::TEXT IS NULL OR al.recognized_plate ILIKE '%' || $6 || '%')
ORDER BY al.occurred_at DESC
LIMIT $7 OFFSET $8;

-- Q26: Подсчёт строк для пагинации (те же фильтры без LIMIT/OFFSET)
SELECT COUNT(*) AS total
FROM access_log al
WHERE ($1::TIMESTAMPTZ IS NULL OR al.occurred_at >= $1)
  AND ($2::TIMESTAMPTZ IS NULL OR al.occurred_at <= $2)
  AND ($3::TEXT IS NULL OR al.gate_number  = $3)
  AND ($4::TEXT IS NULL OR al.event_type   = $4)
  AND ($5::BOOL IS NULL OR al.is_success   = $5)
  AND ($6::TEXT IS NULL OR al.recognized_plate ILIKE '%' || $6 || '%');

-- Q27: Записать событие въезда (вызывается из Python FastAPI после распознавания)
INSERT INTO access_log (
    event_type, direction, vehicle_id, camera_id, gate_number,
    recognized_plate, detect_confidence, ocr_confidence,
    is_success, deny_reason, notes
)
VALUES (
    $1, $2,
    $3::INTEGER,  -- NULL если не найдено в БД
    $4::INTEGER,
    $5,
    $6,
    $7::NUMERIC,  -- уверенность YOLOv11
    $8::NUMERIC,  -- уверенность PaddleOCR
    $9::BOOLEAN,
    NULLIF($10, ''),
    NULLIF($11, '')
)
RETURNING id;

-- Q28: История въездов конкретного ТС
SELECT
    al.occurred_at,
    al.direction,
    al.gate_number,
    al.event_type,
    al.is_success,
    al.deny_reason,
    al.detect_confidence,
    al.ocr_confidence,
    c.name AS camera_name
FROM access_log al
LEFT JOIN cameras c ON c.id = al.camera_id
WHERE al.vehicle_id = $1
ORDER BY al.occurred_at DESC
LIMIT 50;


-- ================================================================
-- ЭКРАН: Видеонаблюдение — камеры
-- ================================================================

-- Q29: Список всех камер
SELECT
    c.*,
    -- Количество событий через эту камеру за сегодня
    COUNT(al.id) AS events_today
FROM cameras c
LEFT JOIN access_log al
       ON al.camera_id = c.id
      AND al.occurred_at >= CURRENT_DATE
GROUP BY c.id
ORDER BY c.gate_number NULLS LAST, c.name;

-- Q30: Изменить статус камеры
UPDATE cameras
SET status     = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING name, status;


-- ================================================================
-- ЭКРАН: Аудит системы
-- ================================================================

-- Q31: Список событий аудита с фильтрами
SELECT
    al.id,
    al.occurred_at,
    al.action,
    al.resource,
    al.resource_id,
    al.details,
    al.status,
    al.severity,
    al.ip_address,
    u.username,
    r.display_name AS role_display
FROM audit_log al
LEFT JOIN users u ON u.id = al.user_id
LEFT JOIN roles r ON r.id = u.role_id
WHERE ($1::TIMESTAMPTZ IS NULL OR al.occurred_at >= $1)
  AND ($2::TIMESTAMPTZ IS NULL OR al.occurred_at <= $2)
  AND ($3::TEXT IS NULL OR al.status   = $3)
  AND ($4::TEXT IS NULL OR al.severity = $4)
  AND ($5::TEXT IS NULL OR al.action   ILIKE '%' || $5 || '%')
  AND ($6::INT  IS NULL OR al.user_id  = $6)
ORDER BY al.occurred_at DESC
LIMIT $7 OFFSET $8;

-- Q32: Записать событие аудита
INSERT INTO audit_log (user_id, action, resource, resource_id, details, status, severity, ip_address)
VALUES ($1::INTEGER, $2, NULLIF($3,''), $4::INTEGER, $5, $6, $7, $8::INET)
RETURNING id;


-- ================================================================
-- СТАТИСТИКА (для диплома и дашборда)
-- ================================================================

-- Q33: Статистика въездов по воротам за период
SELECT
    gate_number,
    COUNT(*)                                    AS total_events,
    COUNT(*) FILTER (WHERE is_success = TRUE)   AS allowed,
    COUNT(*) FILTER (WHERE is_success = FALSE)  AS denied,
    COUNT(*) FILTER (WHERE deny_reason = 'not_found')  AS denied_not_found,
    COUNT(*) FILTER (WHERE deny_reason = 'blocked')    AS denied_blocked,
    COUNT(*) FILTER (WHERE deny_reason = 'wrong_gate') AS denied_wrong_gate,
    ROUND(AVG(detect_confidence), 1) AS avg_detect_conf,
    ROUND(AVG(ocr_confidence),    1) AS avg_ocr_conf
FROM access_log
WHERE occurred_at BETWEEN $1 AND $2
GROUP BY gate_number
ORDER BY gate_number;

-- Q34: Топ-10 активных ТС за период
SELECT
    v.license_plate,
    v.brand,
    v.model,
    v.allowed_gates,
    COUNT(*) AS total_entries,
    MAX(al.occurred_at) AS last_entry
FROM access_log al
JOIN vehicles v ON v.id = al.vehicle_id
WHERE al.occurred_at BETWEEN $1 AND $2
  AND al.is_success = TRUE
GROUP BY v.id, v.license_plate, v.brand, v.model, v.allowed_gates
ORDER BY total_entries DESC
LIMIT 10;

-- Q35: Почасовая активность за день (для графика на дашборде)
SELECT
    DATE_TRUNC('hour', occurred_at) AS hour,
    COUNT(*)                         AS total,
    COUNT(*) FILTER (WHERE is_success = TRUE)  AS allowed,
    COUNT(*) FILTER (WHERE is_success = FALSE) AS denied
FROM access_log
WHERE occurred_at >= CURRENT_DATE
  AND occurred_at <  CURRENT_DATE + INTERVAL '1 day'
GROUP BY DATE_TRUNC('hour', occurred_at)
ORDER BY hour;
