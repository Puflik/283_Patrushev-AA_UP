// ═══════════════════════════════════════════════════════════
//  shared.js  —  общие функции, используемые всеми страницами
// ═══════════════════════════════════════════════════════════

// ── Нормализация типа пользователя из БД ─────────────────────
// В БД хранятся: Заказчик, Автомеханик, Менеджер, Оператор, Администратор
function normalizeType(type) {
  if (!type) return '';
  const map = {
    'Заказчик':      'client',
    'Автомеханик':   'mechanic',
    'Менеджер':      'manager',
    'Оператор':      'operator',
    'Администратор': 'admin'
  };
  return map[type] || type;
}

// ── Модальные окна ───────────────────────────────────────────
function hideModal() {
  const m = document.getElementById('app-modal');
  if (m) m.remove();
}

function showModal(type, message, title) {
  hideModal();
  const icons = { info: 'ℹ️', warning: '⚠️', error: '❌' };
  const backdrop = document.createElement('div');
  backdrop.id = 'app-modal';
  backdrop.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000;' +
    'display:flex;align-items:center;justify-content:center;';
  const modal = document.createElement('div');
  modal.className = 'card';
  modal.style.cssText = 'width:90%;max-width:420px;';
  modal.innerHTML =
    '<div class="card-header"><span class="card-title">' +
      (icons[type] || '') + ' ' + (title || '') +
    '</span></div>' +
    '<div style="margin-bottom:16px;font-size:.9rem;line-height:1.55;">' + message + '</div>' +
    '<div class="flex gap-12" id="modal-footer">' +
      '<button class="btn btn-primary" id="modal-ok">OK</button>' +
      '<button class="btn btn-ghost hidden" id="modal-cancel">Отмена</button>' +
    '</div>';
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  document.getElementById('modal-ok').addEventListener('click', hideModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) hideModal(); });
}

function showInfo(message, title)    { showModal('info',    message, title || 'Информация'); }
function showWarning(message, title) { showModal('warning', message, title || 'Внимание'); }
function showError(message, title)   { showModal('error',   message, title || 'Ошибка'); }

function confirmAction(message) {
  return new Promise(resolve => {
    showModal('warning', message, 'Подтверждение');
    const ok     = document.getElementById('modal-ok');
    const cancel = document.getElementById('modal-cancel');
    cancel.classList.remove('hidden');
    ok.addEventListener('click',     () => { hideModal(); resolve(true);  });
    cancel.addEventListener('click', () => { hideModal(); resolve(false); });
  });
}

// ── Текущий пользователь ─────────────────────────────────────
var _currentUser = null;

async function getCurrentUser() {
  if (_currentUser) return _currentUser;
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.ok) {
      const raw = await res.json();
      raw.type = normalizeType(raw.type);
      _currentUser = raw;
      const idEl   = document.getElementById('currentUserId');
      const roleEl = document.getElementById('currentUserRole');
      if (idEl)   idEl.value   = _currentUser.userID;
      if (roleEl) roleEl.value = _currentUser.type;
      return _currentUser;
    } else {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return null;
    }
  } catch (e) {
    console.error('getCurrentUser error', e);
    return null;
  }
}

// ── Инициализация сайдбара (сотрудники) ──────────────────────
async function initSidebar() {
  const user = await getCurrentUser();
  if (!user) return;

  const nameEl       = document.getElementById('sidebarName');
  const avatarEl     = document.getElementById('sidebarAvatar');
  const roleEl       = document.getElementById('sidebarRole');
  const linkStaff    = document.getElementById('linkStaff');
  const linkStats    = document.getElementById('linkStats');
  const linkMessages = document.getElementById('linkMessages');

  if (nameEl)   nameEl.textContent   = user.fio;
  if (avatarEl) avatarEl.textContent = initials(user.fio);
  if (roleEl)   roleEl.textContent   = roleLabel(user.type);

  if (linkStaff)    linkStaff.classList.toggle('hidden', user.type !== 'admin');
  if (linkStats)    linkStats.classList.toggle('hidden',
      user.type === 'client' || user.type === 'mechanic');
  if (linkMessages) linkMessages.classList.toggle('hidden',
      !['operator','manager','admin'].includes(user.type));

  const btnNewReq = document.getElementById('btnNewReq');
  if (btnNewReq) btnNewReq.classList.toggle('hidden', user.type === 'mechanic');
}

// ── Навбар клиента ───────────────────────────────────────────
async function initClientNav() {
  const user = await getCurrentUser();
  if (!user) return;
  const nameEl   = document.getElementById('navName');
  const avatarEl = document.getElementById('navAvatar');
  if (nameEl)   nameEl.textContent   = user.fio;
  if (avatarEl) avatarEl.textContent = initials(user.fio);
}

// ── Вспомогательные ─────────────────────────────────────────
function initials(fio) {
  if (!fio) return '?';
  const parts = fio.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : fio[0].toUpperCase();
}

function roleLabel(type) {
  const map = {
    client:   'Заказчик',
    mechanic: 'Автомеханик',
    operator: 'Оператор',
    manager:  'Менеджер',
    admin:    'Администратор'
  };
  return map[type] || type;
}

function statusLabel(status) {
  const map = {
    'Новая заявка':           'Новая',
    'В процессе ремонта':     'В работе',
    'Ожидание автозапчастей': 'Ожидание',
    'Готова к выдаче':        'Завершено',
    'Отменена':               'Отменено',
    'new':         'Новая',
    'in_progress': 'В работе',
    'waiting':     'Ожидание',
    'done':        'Завершено',
    'cancelled':   'Отменено'
  };
  return map[status] || status;
}

function statusBadgeClass(status) {
  if (status === 'Новая заявка'           || status === 'new')         return 'badge-new';
  if (status === 'В процессе ремонта'     || status === 'in_progress') return 'badge-work';
  if (status === 'Ожидание автозапчастей' || status === 'waiting')     return 'badge-wait';
  if (status === 'Готова к выдаче'        || status === 'done')        return 'badge-done';
  if (status === 'Отменена'               || status === 'cancelled')   return 'badge-cancel';
  return '';
}

var statusMap = {
  'new':         ['Новая заявка'],
  'in_progress': ['В процессе ремонта'],
  'waiting':     ['Ожидание автозапчастей'],
  'done':        ['Готова к выдаче'],
  'cancelled':   ['Отменена']
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00').toLocaleDateString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric'});
}
