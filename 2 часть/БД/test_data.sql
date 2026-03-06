-- ================================================================
--  Файл: 003_test_data.sql — Тестовые данные (реалистичные)
--  Соответствуют скриншотам приложения
-- ================================================================

-- ----------------------------------------------------------------
-- Пользователи (пароли хэшированы bcrypt)
-- admin/admin123 | moderator/moder123 | user/user123
-- ----------------------------------------------------------------
INSERT INTO users (username, email, password_hash, role_id, session_timeout) VALUES
  ('admin',     'admin@skud-company.ru',
   crypt('admin123', gen_salt('bf', 12)),
   (SELECT id FROM roles WHERE name = 'admin'), 30),

  ('moderator', 'moderator@skud-company.ru',
   crypt('moder123', gen_salt('bf', 12)),
   (SELECT id FROM roles WHERE name = 'moderator'), 30),

  ('user',      'user@skud-company.ru',
   crypt('user123', gen_salt('bf', 12)),
   (SELECT id FROM roles WHERE name = 'employee'), 30),

  ('petrov',    'petrov@skud-company.ru',
   crypt('petrov2024', gen_salt('bf', 12)),
   (SELECT id FROM roles WHERE name = 'employee'), 30),

  ('ivanova',   'ivanova@skud-company.ru',
   crypt('ivanova2024', gen_salt('bf', 12)),
   (SELECT id FROM roles WHERE name = 'moderator'), 30);

-- ----------------------------------------------------------------
-- Сотрудники предприятия
-- ----------------------------------------------------------------
INSERT INTO employees (user_id, first_name, last_name, middle_name, position, department, phone, badge_number, is_active, hired_at) VALUES
  ((SELECT id FROM users WHERE username = 'petrov'),
   'Пётр', 'Петров', 'Сергеевич', 'Ведущий инженер', 'Производственный отдел', '+7-900-111-22-33', 'EMP-001', TRUE, '2020-03-15'),

  ((SELECT id FROM users WHERE username = 'ivanova'),
   'Мария', 'Иванова', 'Александровна', 'Менеджер по персоналу', 'HR-отдел', '+7-900-444-55-66', 'EMP-002', TRUE, '2019-07-01'),

  (NULL, 'Алексей', 'Сидоров', 'Викторович', 'Охранник', 'Служба безопасности', '+7-900-777-88-99', 'EMP-003', TRUE, '2021-01-10'),

  (NULL, 'Елена', 'Козлова', 'Дмитриевна', 'Бухгалтер', 'Бухгалтерия', '+7-900-222-33-44', 'EMP-004', TRUE, '2018-09-20'),

  (NULL, 'Дмитрий', 'Новиков', 'Павлович', 'Водитель', 'АХО', '+7-900-555-66-77', 'EMP-005', TRUE, '2022-05-05'),

  (NULL, 'Ольга', 'Морозова', 'Игоревна', 'Секретарь', 'Администрация', '+7-900-333-44-55', 'EMP-006', FALSE, '2017-04-12');

-- ----------------------------------------------------------------
-- Транспортные средства (точно как на скрине)
-- ----------------------------------------------------------------
INSERT INTO vehicles (license_plate, brand, model, vehicle_type, year, color, vin, owner_id, status, entry_type, is_allowed) VALUES
  ('А123БВ777', 'Toyota',  'Camry',   'Седан',      2022, 'Черный', '2T1BURHE0JC123456', NULL, 'active',      'car',   TRUE),
  ('В456ГД888', 'Hyundai', 'Tucson',  'Внедорожник', 2021, 'Белый', 'KM8J3CA46JU789012', NULL, 'active',      'car',   TRUE),
  ('Е789Ж3999', 'Ford',    'Transit', 'Минивэн',    2020, 'Серый', 'WF0XXXTTGXKA12345', NULL, 'maintenance', 'truck', TRUE),
  ('К001МН77',  'KAMAZ',   '6520',    'Грузовик',   2019, 'Синий', 'XTC65200090123456',
   (SELECT id FROM employees WHERE badge_number = 'EMP-005'), 'active', 'truck', TRUE),
  ('Р222СТ199', 'Lada',    'Vesta',   'Седан',      2023, 'Красный', 'XTA21900L0123456', NULL, 'active', 'car', FALSE);  -- заблокирован

-- ----------------------------------------------------------------
-- Камеры видеонаблюдения (точно как на скрине)
-- ----------------------------------------------------------------
INSERT INTO cameras (name, location, camera_type, model, ip_address, resolution, fps, description, status, purpose) VALUES
  ('Камера въезда',    'Главный въезд',   'Цилиндрическая', 'Hikvision DS-2CD2143G0', '192.168.1.100', 'Full HD (1080p)', 30, 'Контроль въезда на территорию',    'online',      'plate'),
  ('Камера парковки',  'Парковка А',      'Купольная',       'Dahua IPC-HFW2831T',     '192.168.1.101', '4K Ultra HD',    25, 'Наблюдение за парковочной зоной',  'online',      'general'),
  ('Камера периметра', 'Северная стена',  'PTZ (поворотная)', 'Axis P5655-E',          '192.168.1.102', 'Full HD (1080p)', 25, 'Контроль периметра территории',    'maintenance', 'general'),
  ('Камера проходной', 'Проходная №1',   'Купольная',       'Hikvision DS-2DE4425IW', '192.168.1.103', 'Full HD (1080p)', 30, 'Распознавание лиц сотрудников',    'online',      'face'),
  ('Камера склада',    'Склад (въезд)',   'Цилиндрическая', 'Dahua SD49425XB-HNR',    '192.168.1.104', '4K Ultra HD',    20, 'Контроль въезда грузового транспорта', 'offline', 'plate');

-- ----------------------------------------------------------------
-- Журнал событий доступа (access_log)
-- ----------------------------------------------------------------
INSERT INTO access_log (event_type, direction, employee_id, vehicle_id, camera_id, recognized_data, confidence, is_success, occurred_at) VALUES
  ('face',   'in',  (SELECT id FROM employees WHERE badge_number = 'EMP-001'), NULL,
   (SELECT id FROM cameras WHERE name = 'Камера проходной'),
   'Петров Пётр Сергеевич', 97.34, TRUE,  NOW() - INTERVAL '2 hours'),

  ('face',   'in',  (SELECT id FROM employees WHERE badge_number = 'EMP-002'), NULL,
   (SELECT id FROM cameras WHERE name = 'Камера проходной'),
   'Иванова Мария Александровна', 94.12, TRUE, NOW() - INTERVAL '3 hours'),

  ('plate',  'in',  NULL, (SELECT id FROM vehicles WHERE license_plate = 'А123БВ777'),
   (SELECT id FROM cameras WHERE name = 'Камера въезда'),
   'А123БВ777', 98.76, TRUE,  NOW() - INTERVAL '4 hours'),

  ('plate',  'in',  NULL, (SELECT id FROM vehicles WHERE license_plate = 'Р222СТ199'),
   (SELECT id FROM cameras WHERE name = 'Камера въезда'),
   'Р222СТ199', 95.00, FALSE, NOW() - INTERVAL '5 hours'),  -- отказано (is_allowed = FALSE)

  ('face',   'out', (SELECT id FROM employees WHERE badge_number = 'EMP-003'), NULL,
   (SELECT id FROM cameras WHERE name = 'Камера проходной'),
   'Сидоров Алексей Викторович', 91.50, TRUE,  NOW() - INTERVAL '1 hour'),

  ('denied', 'in',  NULL, NULL,
   (SELECT id FROM cameras WHERE name = 'Камера въезда'),
   'Неизвестный номер: В999ЕЕ99', NULL, FALSE, NOW() - INTERVAL '30 minutes');

-- ----------------------------------------------------------------
-- Журнал аудита системы (audit_log) — как на экране аудита
-- ----------------------------------------------------------------
INSERT INTO audit_log (user_id, action, resource, resource_id, details, status, severity, ip_address, occurred_at) VALUES
  ((SELECT id FROM users WHERE username = 'admin'),
   'LOGIN', NULL, NULL,
   'Система запущена пользователем: Администратор', 'info', 'info', '192.168.1.1', NOW() - INTERVAL '1 hour 35 min'),

  ((SELECT id FROM users WHERE username = 'admin'),
   'CREATE', 'vehicles', (SELECT id FROM vehicles WHERE license_plate = 'А123БВ777'),
   'Новый автомобиль добавлен: А123БВ777 (Toyota Camry)', 'success', 'info', '192.168.1.1', NOW() - INTERVAL '1 hour 44 min'),

  ((SELECT id FROM users WHERE username = 'admin'),
   'SYNC_ERROR', 'employees', NULL,
   'Ошибка синхронизации с базой данных сотрудников', 'error', 'critical', '192.168.1.1', NOW() - INTERVAL '1 hour 54 min'),

  ((SELECT id FROM users WHERE username = 'moderator'),
   'UPDATE', 'employees', (SELECT id FROM employees WHERE badge_number = 'EMP-001'),
   'Профиль сотрудника Петров П.С. успешно обновлён', 'success', 'info', '192.168.1.101', NOW() - INTERVAL '2 hours 1 min'),

  ((SELECT id FROM users WHERE username = 'admin'),
   'BACKUP', NULL, NULL,
   'Резервное копирование базы данных выполнено успешно', 'info', 'info', '192.168.1.1', NOW() - INTERVAL '2 hours 29 min'),

  ((SELECT id FROM users WHERE username = 'moderator'),
   'ACCESS_DENIED', 'settings', NULL,
   'Попытка несанкционированного доступа к разделу Настройки. Путь: /admin/settings', 'warning', 'warning', '192.168.1.101', NOW() - INTERVAL '3 hours'),

  ((SELECT id FROM users WHERE username = 'admin'),
   'PERMISSION_CHANGE', 'employees', (SELECT id FROM users WHERE username = 'moderator'),
   'Изменение прав доступа: Пользователь moderator. Изменение прав доступа', 'success', 'info', '192.168.1.100', NOW() - INTERVAL '4 hours');

-- ----------------------------------------------------------------
-- Уведомления (как на Главном экране)
-- ----------------------------------------------------------------
INSERT INTO notifications (title, message, type, is_read, target_role_id) VALUES
  ('Требуется обновление ПО',
   'Доступна новая версия системы СКУД v2.1.0. Рекомендуется обновление.',
   'warning', FALSE, NULL),

  ('Новые правила использования',
   'Внесены изменения в политику безопасности предприятия. Ознакомьтесь с документом.',
   'info', FALSE, NULL),

  ('Камера периметра — обслуживание',
   'Камера на северной стене переведена в режим обслуживания до 10.03.2025.',
   'warning', FALSE, (SELECT id FROM roles WHERE name = 'admin'));

