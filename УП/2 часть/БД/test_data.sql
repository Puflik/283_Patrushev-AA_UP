-- ================================================================
--  СКУД — Файл: 003_test_data.sql v2
--  Тестовые данные под обновлённую схему
-- ================================================================

-- ================================================================
-- СОТРУДНИКИ
-- ================================================================
INSERT INTO employees (first_name, last_name, middle_name, position, department, phone, badge_number, is_active, hired_at)
VALUES
  ('Иван',    'Петров',    'Сергеевич', 'Директор',           'Руководство',   '+7-900-111-0001', 'B001', TRUE, '2020-01-15'),
  ('Мария',   'Сидорова',  'Ивановна',  'Главный бухгалтер',  'Бухгалтерия',   '+7-900-111-0002', 'B002', TRUE, '2020-03-01'),
  ('Алексей', 'Козлов',    'Петрович',  'Начальник склада',   'Склад',         '+7-900-111-0003', 'B003', TRUE, '2021-05-10'),
  ('Ольга',   'Новикова',  'Дмитриевна','Менеджер',           'Продажи',       '+7-900-111-0004', 'B004', TRUE, '2021-08-20'),
  ('Дмитрий', 'Морозов',   'Алексеевич','Водитель-экспедитор','Логистика',     '+7-900-111-0005', 'B005', TRUE, '2022-01-10'),
  ('Светлана','Волкова',   'Николаевна','Охранник',           'Безопасность',  '+7-900-111-0006', 'B006', TRUE, '2022-03-15'),
  ('Николай', 'Зайцев',    'Васильевич','Водитель',           'Логистика',     '+7-900-111-0007', 'B007', TRUE, '2022-06-01'),
  ('Татьяна', 'Соколова',  'Игоревна',  'HR-менеджер',        'Кадры',         '+7-900-111-0008', 'B008', TRUE, '2023-02-14'),
  ('Андрей',  'Лебедев',   'Романович', 'Инженер ИТ',         'ИТ-отдел',      '+7-900-111-0009', 'B009', TRUE, '2023-04-01'),
  ('Елена',   'Егорова',   'Степановна','Кладовщик',          'Склад',         '+7-900-111-0010', 'B010', FALSE,'2019-09-01');

-- ================================================================
-- ТРАНСПОРТНЫЕ СРЕДСТВА (обновлено: allowed_gates вместо entry_type)
-- ================================================================
INSERT INTO vehicles (license_plate, brand, model, vehicle_type, year, color, owner_id, status, allowed_gates, notes)
VALUES
  -- Личные авто сотрудников — gate_1 (легковой въезд)
  ('А123ВС777', 'Toyota',     'Camry',      'Седан',      2021, 'Белый',
   (SELECT id FROM employees WHERE badge_number='B001'), 'active', 'gate_1', 'Авто директора'),
  ('В456ЕК799', 'Volkswagen', 'Tiguan',     'Внедорожник',2020, 'Серый',
   (SELECT id FROM employees WHERE badge_number='B002'), 'active', 'gate_1', NULL),
  ('С789МН116', 'Hyundai',    'Solaris',    'Седан',      2022, 'Синий',
   (SELECT id FROM employees WHERE badge_number='B004'), 'active', 'gate_1', NULL),
  ('Т321РС750', 'Kia',        'Sportage',   'Внедорожник',2019, 'Чёрный',
   (SELECT id FROM employees WHERE badge_number='B008'), 'active', 'gate_1', NULL),
  ('У654ОА197', 'Lada',       'Vesta',      'Седан',      2023, 'Красный',
   (SELECT id FROM employees WHERE badge_number='B009'), 'active', 'gate_1', NULL),

  -- Грузовые ТС компании — gate_2 (грузовой въезд)
  ('К147НМ750', 'КАМАЗ',      '65115',      'Грузовик',   2018, 'Синий',
   (SELECT id FROM employees WHERE badge_number='B005'), 'active', 'gate_2', 'Самосвал, доставка стройматериалов'),
  ('М258ОР799', 'МАЗ',        '5340',       'Грузовик',   2019, 'Зелёный',
   (SELECT id FROM employees WHERE badge_number='B007'), 'active', 'gate_2', 'Бортовой грузовик'),
  ('Н369ПС116', 'Volvo',      'FH16',       'Грузовик',   2020, 'Белый',
   (SELECT id FROM employees WHERE badge_number='B005'), 'active', 'gate_2', 'Фура, межрегиональные рейсы'),
  ('Р741ТУ777', 'Газель',     'Next',       'Грузовик',   2021, 'Белый',
   (SELECT id FROM employees WHERE badge_number='B003'), 'active', 'gate_2', 'Малотоннажный, развоз по городу'),

  -- Авто с доступом через любые ворота — all
  ('Е852ФХ750', 'Ford',       'Transit',    'Минивэн',    2022, 'Серебристый',
   (SELECT id FROM employees WHERE badge_number='B003'), 'active', 'all',    'Корпоративный микроавтобус'),

  -- Заблокированное ТС
  ('Ж963ЦЧ799', 'BMW',        'X5',         'Внедорожник',2018, 'Чёрный',
   NULL, 'blocked', 'none', 'Заблокирован — нарушение правил парковки'),

  -- Авто на обслуживании
  ('И174ШЩ116', 'Mercedes',   'Sprinter',   'Минивэн',    2020, 'Белый',
   (SELECT id FROM employees WHERE badge_number='B007'), 'maintenance', 'gate_1', 'На техническом обслуживании до 15.03');

-- ================================================================
-- КАМЕРЫ (gate_number вместо purpose=face)
-- ================================================================
INSERT INTO cameras (name, location, camera_type, model, ip_address, resolution, fps, status, gate_number, purpose, description)
VALUES
  ('Камера въезда №1',   'Ворота №1 (легковой въезд)', 'Цилиндрическая', 'Hikvision DS-2CD2T47G2',
   '192.168.1.101', 'Full HD (1080p)', 30, 'online',  'gate_1', 'plate',
   'Основная камера распознавания номеров на легковом въезде'),

  ('Камера въезда №2',   'Ворота №2 (грузовой въезд)', 'Цилиндрическая', 'Hikvision DS-2CD2T47G2',
   '192.168.1.102', 'Full HD (1080p)', 30, 'online',  'gate_2', 'plate',
   'Основная камера распознавания номеров на грузовом въезде'),

  ('Камера парковки А',  'Парковка — сектор А',        'Купольная',       'Dahua IPC-HDW2849H',
   '192.168.1.103', 'Full HD (1080p)', 25, 'online',  NULL,     'general',
   'Обзорная камера парковки'),

  ('Камера склада',      'Территория склада',          'Купольная',       'Dahua IPC-HDW2849H',
   '192.168.1.104', 'Full HD (1080p)', 25, 'online',  NULL,     'general',
   'Обзорная камера склада'),

  ('Камера КПП',         'Контрольно-пропускной пункт','PTZ (поворотная)','Hikvision DS-2DE4425IW',
   '192.168.1.105', '4K Ultra HD',    25, 'online',  NULL,     'general',
   'Поворотная камера КПП, ручное управление охраной'),

  ('Камера въезда №1 (резерв)', 'Ворота №1 — резервная', 'Цилиндрическая', 'Hikvision DS-2CD2143G0',
   '192.168.1.106', 'Full HD (1080p)', 25, 'offline', 'gate_1', 'plate',
   'Резервная камера, в данный момент отключена');

-- ================================================================
-- ТЕСТОВЫЕ СОБЫТИЯ ДОСТУПА
-- ================================================================
INSERT INTO access_log (event_type, direction, vehicle_id, camera_id, gate_number, recognized_plate, detect_confidence, ocr_confidence, is_success, deny_reason, occurred_at)
VALUES
  -- Успешные въезды через gate_1
  ('plate', 'in',
   (SELECT id FROM vehicles WHERE license_plate='А123ВС777'),
   (SELECT id FROM cameras  WHERE ip_address='192.168.1.101'),
   'gate_1', 'А123ВС777', 96.50, 98.20, TRUE, NULL,
   NOW() - INTERVAL '2 hours'),

  ('plate', 'in',
   (SELECT id FROM vehicles WHERE license_plate='В456ЕК799'),
   (SELECT id FROM cameras  WHERE ip_address='192.168.1.101'),
   'gate_1', 'В456ЕК799', 94.80, 97.10, TRUE, NULL,
   NOW() - INTERVAL '1 hour 45 minutes'),

  -- Успешный въезд через gate_2
  ('plate', 'in',
   (SELECT id FROM vehicles WHERE license_plate='К147НМ750'),
   (SELECT id FROM cameras  WHERE ip_address='192.168.1.102'),
   'gate_2', 'К147НМ750', 91.20, 95.40, TRUE, NULL,
   NOW() - INTERVAL '1 hour 30 minutes'),

  -- Отказ — не найден в БД
  ('denied', 'in',
   NULL,
   (SELECT id FROM cameras WHERE ip_address='192.168.1.101'),
   'gate_1', 'О999ОО799', 88.50, 92.30, FALSE, 'not_found',
   NOW() - INTERVAL '1 hour'),

  -- Отказ — заблокирован
  ('denied', 'in',
   (SELECT id FROM vehicles WHERE license_plate='Ж963ЦЧ799'),
   (SELECT id FROM cameras  WHERE ip_address='192.168.1.101'),
   'gate_1', 'Ж963ЦЧ799', 95.10, 97.80, FALSE, 'blocked',
   NOW() - INTERVAL '50 minutes'),

  -- Отказ — не те ворота (фура пытается въехать через gate_1)
  ('denied', 'in',
   (SELECT id FROM vehicles WHERE license_plate='Н369ПС116'),
   (SELECT id FROM cameras  WHERE ip_address='192.168.1.101'),
   'gate_1', 'Н369ПС116', 93.70, 96.50, FALSE, 'wrong_gate',
   NOW() - INTERVAL '40 minutes'),

  -- Выезды
  ('plate', 'out',
   (SELECT id FROM vehicles WHERE license_plate='А123ВС777'),
   (SELECT id FROM cameras  WHERE ip_address='192.168.1.101'),
   'gate_1', 'А123ВС777', 97.20, 98.90, TRUE, NULL,
   NOW() - INTERVAL '30 minutes'),

  -- Ручной пропуск охранником
  ('manual', 'in',
   (SELECT id FROM vehicles WHERE license_plate='Е852ФХ750'),
   (SELECT id FROM cameras WHERE ip_address='192.168.1.105'),
   'gate_1', NULL, NULL, NULL, TRUE, NULL,
   NOW() - INTERVAL '20 minutes'),

  -- Ещё несколько для статистики
  ('plate', 'in',
   (SELECT id FROM vehicles WHERE license_plate='М258ОР799'),
   (SELECT id FROM cameras  WHERE ip_address='192.168.1.102'),
   'gate_2', 'М258ОР799', 89.40, 94.60, TRUE, NULL,
   NOW() - INTERVAL '15 minutes'),

  ('plate', 'in',
   (SELECT id FROM vehicles WHERE license_plate='С789МН116'),
   (SELECT id FROM cameras  WHERE ip_address='192.168.1.101'),
   'gate_1', 'С789МН116', 95.80, 97.30, TRUE, NULL,
   NOW() - INTERVAL '10 minutes');

-- ================================================================
-- ТЕСТОВЫЕ СОБЫТИЯ АУДИТА
-- ================================================================
INSERT INTO audit_log (user_id, action, resource, resource_id, details, status, severity, ip_address)
VALUES
  ((SELECT id FROM users WHERE username='admin'),
   'LOGIN', NULL, NULL, 'Успешный вход в систему', 'success', 'info', '192.168.1.10'),

  ((SELECT id FROM users WHERE username='admin'),
   'CREATE', 'vehicles', (SELECT id FROM vehicles WHERE license_plate='А123ВС777'),
   'Добавлено ТС: А123ВС777 (Toyota Camry)', 'success', 'info', '192.168.1.10'),

  ((SELECT id FROM users WHERE username='admin'),
   'EDIT', 'vehicles', (SELECT id FROM vehicles WHERE license_plate='Ж963ЦЧ799'),
   'ТС Ж963ЦЧ799: статус изменён на "blocked"', 'success', 'warning', '192.168.1.10'),

  ((SELECT id FROM users WHERE username='moderator'),
   'LOGIN', NULL, NULL, 'Успешный вход в систему', 'success', 'info', '192.168.1.11'),

  ((SELECT id FROM users WHERE username='moderator'),
   'CREATE', 'employees', NULL,
   'Добавлен сотрудник: Лебедев Андрей Романович (ИТ-отдел)', 'success', 'info', '192.168.1.11'),

  ((SELECT id FROM users WHERE username='admin'),
   'PERMISSION_CHANGE', 'settings', NULL,
   'Изменены права роли "moderator": vehicles.can_delete = FALSE', 'success', 'warning', '192.168.1.10'),

  ((SELECT id FROM users WHERE username='user'),
   'ACCESS_DENIED', 'settings', NULL,
   'Попытка доступа к разделу "Настройки" без прав', 'warning', 'warning', '192.168.1.12'),

  ((SELECT id FROM users WHERE username='admin'),
   'LOGOUT', NULL, NULL, 'Выход из системы', 'info', 'info', '192.168.1.10');

-- ================================================================
-- УВЕДОМЛЕНИЯ
-- ================================================================
INSERT INTO notifications (title, message, type, is_read, target_role_id)
VALUES
  ('Требуется обновление ПО',
   'Доступна новая версия системы СКУД v2.1.0. Рекомендуется обновление.',
   'warning', FALSE,
   (SELECT id FROM roles WHERE name = 'admin')),

  ('Камера въезда №1 (резерв) отключена',
   'Резервная камера на воротах №1 не отвечает более 24 часов.',
   'warning', FALSE, NULL),

  ('Попытка въезда в нерабочее время',
   'Зафиксирована попытка въезда в 03:42 — транспортное средство О999ОО799 не найдено в БД.',
   'error', FALSE,
   (SELECT id FROM roles WHERE name = 'admin')),

  ('Плановое обслуживание',
   'Mercedes Sprinter (И174ШЩ116) направлен на техническое обслуживание.',
   'info', TRUE, NULL);
