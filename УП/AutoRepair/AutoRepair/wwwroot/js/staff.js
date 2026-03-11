// staff.js
let allUsers = [];
let allReqs  = [];
let roleFilter = 'all';

async function loadData() {
  const [uRes, rRes] = await Promise.all([
    fetch('/api/users'),
    fetch('/api/requests')
  ]);
  if (uRes.ok) {
    allUsers = (await uRes.json()).map(u => ({ ...u, _normType: normalizeType(u.type) }));
  }
  if (rRes.ok) allReqs = await rRes.json();
  renderStaff();
}

function renderStaff() {
  const tbody = document.querySelector('#t1 tbody');
  tbody.innerHTML = '';

  // Показываем только сотрудников (не клиентов)
  let list = allUsers.filter(u => u._normType !== 'client');

  if (roleFilter === 'mechanic')  list = list.filter(u => u._normType === 'mechanic');
  else if (roleFilter === 'manager')  list = list.filter(u => u._normType === 'manager');
  else if (roleFilter === 'operator') list = list.filter(u => u._normType === 'operator');
  else if (roleFilter === 'admin')    list = list.filter(u => u._normType === 'admin');
  else if (roleFilter === 'inactive') list = list.filter(u => u._normType.startsWith('inactive_'));
  else list = list.filter(u => !u._normType.startsWith('inactive_'));

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted);">Нет сотрудников</td></tr>';
    return;
  }

  list.forEach(u => {
    const active = !u._normType.startsWith('inactive_');
    const activeReqs = allReqs.filter(r =>
      r.masterID === u.userID &&
      ['Новая заявка','В процессе ремонта','Ожидание автозапчастей'].includes(r.requestStatus)
    ).length;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;
               font-size:.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${initials(u.fio)}
          </div>
          <div>
            <div class="font-bold">${u.fio}</div>
            <div class="text-muted text-xs">${u.phone}</div>
          </div>
        </div>
      </td>
      <td>${roleLabel(u._normType)}</td>
      <td>${u.phone}</td>
      <td>${u.login}</td>
      <td><span class="badge ${active ? 'badge-done' : 'badge-cancel'}">${active ? 'Активен' : 'Неактивен'}</span></td>
      <td>${activeReqs}</td>
      <td></td>`;
    if (active) {
      const btn = document.createElement('button');
      btn.textContent = 'Деактивировать';
      btn.className = 'btn btn-danger btn-sm';
      btn.addEventListener('click', async () => {
        if (!await confirmAction(`Деактивировать сотрудника ${u.fio}?`)) return;
        const res = await fetch(`/api/users/${u.userID}`, { method: 'DELETE' });
        if (res.ok) await loadData();
        else showError('Ошибка');
      });
      tr.querySelector('td:last-child').appendChild(btn);
    }
    tbody.append(tr);
  });
}

// Фильтры
document.querySelectorAll('#staffPills .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#staffPills .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    roleFilter = btn.dataset.r;
    renderStaff();
  });
});

// Добавить сотрудника
document.getElementById('btnAddStaff').addEventListener('click', () => {
  // сбросить форму
  document.getElementById('asName').value     = '';
  document.getElementById('asPhone').value    = '';
  document.getElementById('asLogin').value    = '';
  document.getElementById('asPassword').value = '';
  document.getElementById('asErr').textContent = '';
  document.getElementById('addStaffModal').classList.remove('hidden');
});

document.getElementById('asCancelBtn').addEventListener('click', () =>
  document.getElementById('addStaffModal').classList.add('hidden'));

document.getElementById('addStaffModal').addEventListener('click', e => {
  if (e.target === document.getElementById('addStaffModal'))
    document.getElementById('addStaffModal').classList.add('hidden');
});

document.getElementById('asSaveBtn').addEventListener('click', async () => {
  const body = {
    fio:      document.getElementById('asName').value.trim(),
    phone:    document.getElementById('asPhone').value.trim(),
    login:    document.getElementById('asLogin').value.trim(),
    password: document.getElementById('asPassword').value,
    type:     document.getElementById('asRole').value
  };
  const errEl = document.getElementById('asErr');
  if (!body.fio || !body.login || !body.password) {
    errEl.textContent = 'Заполните обязательные поля'; return;
  }
  const res = await fetch('/api/users/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (res.ok) {
    document.getElementById('addStaffModal').classList.add('hidden');
    await loadData();
  } else {
    const err = await res.json().catch(() => ({}));
    errEl.textContent = err.message || 'Ошибка';
  }
});

initSidebar();
loadData();
