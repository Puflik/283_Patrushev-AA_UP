-- ================================================================
--  СКУД — Файл: 002_rbac_seed.sql v2
--  Роли, права, демо-пользователи
-- ================================================================

-- ================================================================
-- РОЛИ
-- ================================================================
INSERT INTO roles (name, display_name, description) VALUES
  ('admin',     'Администратор', 'Полный доступ ко всем разделам. Управление пользователями и настройками'),
  ('moderator', 'Модератор',     'Просмотр и редактирование данных. Без доступа к настройкам безопасности'),
  ('employee',  'Сотрудник',     'Только просмотр журнала собственных событий');

-- ================================================================
-- ПРАВА ДОСТУПА
-- Ресурсы: employees | vehicles | cameras | audit_log | access_log | settings | notifications
-- ================================================================

-- АДМИНИСТРАТОР — полный доступ везде
INSERT INTO permissions (role_id, resource, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, res.resource, TRUE, TRUE, TRUE, TRUE, TRUE
FROM roles r
CROSS JOIN (VALUES
    ('employees'), ('vehicles'), ('cameras'),
    ('audit_log'), ('access_log'), ('settings'), ('notifications')
) AS res(resource)
WHERE r.name = 'admin';

-- МОДЕРАТОР — без удаления и без настроек
INSERT INTO permissions (role_id, resource, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, res.resource, res.v, res.c, res.e, res.d, res.ex
FROM roles r
CROSS JOIN (VALUES
--   resource         view   create  edit   delete  export
    ('employees',     TRUE,  TRUE,   TRUE,  FALSE,  TRUE),
    ('vehicles',      TRUE,  TRUE,   TRUE,  FALSE,  TRUE),
    ('cameras',       TRUE,  FALSE,  FALSE, FALSE,  FALSE),
    ('audit_log',     TRUE,  FALSE,  FALSE, FALSE,  TRUE),
    ('access_log',    TRUE,  FALSE,  FALSE, FALSE,  TRUE),
    ('settings',      FALSE, FALSE,  FALSE, FALSE,  FALSE),
    ('notifications', TRUE,  FALSE,  FALSE, FALSE,  FALSE)
) AS res(resource, v, c, e, d, ex)
WHERE r.name = 'moderator';

-- СОТРУДНИК — только свой журнал и уведомления
INSERT INTO permissions (role_id, resource, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, res.resource, res.v, FALSE, FALSE, FALSE, FALSE
FROM roles r
CROSS JOIN (VALUES
    ('access_log',    TRUE),
    ('employees',     FALSE),
    ('vehicles',      FALSE),
    ('cameras',       FALSE),
    ('audit_log',     FALSE),
    ('settings',      FALSE),
    ('notifications', TRUE)
) AS res(resource, v)
WHERE r.name = 'employee';

-- ================================================================
-- ДЕМО-ПОЛЬЗОВАТЕЛИ
-- ================================================================
INSERT INTO users (username, email, password_hash, role_id)
VALUES
  ('admin',
   'admin@skud.local',
   crypt('admin123', gen_salt('bf', 12)),
   (SELECT id FROM roles WHERE name = 'admin')),

  ('moderator',
   'moderator@skud.local',
   crypt('moder123', gen_salt('bf', 12)),
   (SELECT id FROM roles WHERE name = 'moderator')),

  ('user',
   'user@skud.local',
   crypt('user123', gen_salt('bf', 12)),
   (SELECT id FROM roles WHERE name = 'employee'));
