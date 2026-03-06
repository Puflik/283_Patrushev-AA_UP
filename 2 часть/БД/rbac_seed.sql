-- ================================================================
--  Файл: 002_rbac_seed.sql — Заполнение ролей и прав доступа
--  RBAC: Role-Based Access Control
-- ================================================================

-- ----------------------------------------------------------------
-- Роли (точно как в демо-аккаунтах на экране авторизации)
-- ----------------------------------------------------------------
INSERT INTO roles (name, display_name, description) VALUES
  ('admin',     'Администратор', 'Полный доступ ко всем разделам системы. Управление пользователями и настройками'),
  ('moderator', 'Модератор',     'Просмотр и редактирование данных. Нет доступа к настройкам безопасности'),
  ('employee',  'Сотрудник',     'Только просмотр журнала собственных событий прохода');

-- ----------------------------------------------------------------
-- Права доступа по разделам (ресурсам)
-- Ресурсы: employees | vehicles | cameras | audit_log | settings | access_log
-- ----------------------------------------------------------------

-- == АДМИНИСТРАТОР — полный доступ везде ==
INSERT INTO permissions (role_id, resource, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, res.resource, TRUE, TRUE, TRUE, TRUE, TRUE
FROM roles r
CROSS JOIN (VALUES
    ('employees'),
    ('vehicles'),
    ('cameras'),
    ('audit_log'),
    ('access_log'),
    ('settings'),
    ('notifications')
) AS res(resource)
WHERE r.name = 'admin';

-- == МОДЕРАТОР — видит и редактирует всё кроме настроек ==
INSERT INTO permissions (role_id, resource, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, res.resource, res.v, res.c, res.e, res.d, res.ex
FROM roles r
CROSS JOIN (VALUES
--   resource          view   create  edit   delete  export
    ('employees',      TRUE,  TRUE,   TRUE,  FALSE,  TRUE),
    ('vehicles',       TRUE,  TRUE,   TRUE,  FALSE,  TRUE),
    ('cameras',        TRUE,  FALSE,  FALSE, FALSE,  FALSE),
    ('audit_log',      TRUE,  FALSE,  FALSE, FALSE,  TRUE),
    ('access_log',     TRUE,  FALSE,  FALSE, FALSE,  TRUE),
    ('settings',       FALSE, FALSE,  FALSE, FALSE,  FALSE),
    ('notifications',  TRUE,  FALSE,  FALSE, FALSE,  FALSE)
) AS res(resource, v, c, e, d, ex)
WHERE r.name = 'moderator';

-- == СОТРУДНИК — только просмотр своих данных ==
INSERT INTO permissions (role_id, resource, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, res.resource, res.v, FALSE, FALSE, FALSE, FALSE
FROM roles r
CROSS JOIN (VALUES
    ('access_log',    TRUE),   -- только свой журнал (фильтр по employee_id в запросе)
    ('employees',     FALSE),
    ('vehicles',      FALSE),
    ('cameras',       FALSE),
    ('audit_log',     FALSE),
    ('settings',      FALSE),
    ('notifications', TRUE)
) AS res(resource, v)
WHERE r.name = 'employee';

