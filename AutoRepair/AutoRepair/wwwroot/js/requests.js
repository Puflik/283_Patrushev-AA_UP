// requests.js
let allRequests = [];
let allUsers    = [];

// Типы клиентов в БД (русские значения)
const CLIENT_TYPES = ['client', 'Заказчик'];

async function loadData() {
  const [rRes, uRes] = await Promise.all([
    fetch('/api/requests'),
    fetch('/api/users')
  ]);
  if (rRes.ok) allRequests = await rRes.json();
  if (uRes.ok) {
    const raw = await uRes.json();
    allUsers = raw.map(u => ({ ...u, _normType: normalizeType(u.type) }));
  }
  renderRequests(allRequests);
}

function renderRequests(list) {
  const tbody = document.querySelector('#t1 tbody');
  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--muted);">Заявки не найдены</td></tr>';
    return;
  }
  list.forEach(r => tbody.append(row(r)));
}

function row(r) {
  const mech  = allUsers.find(u => u.userID === r.masterID);
  const badge = `<span class="badge ${statusBadgeClass(r.requestStatus)}">${statusLabel(r.requestStatus)}</span>`;
  const tr    = document.createElement('tr');
  tr.innerHTML = `
    <td>${r.requestID}</td>
    <td>${formatDate(r.startDate)}</td>
    <td>${r.clientFio || '—'}</td>
    <td>${r.carType}</td>
    <td>${r.carModel}</td>
    <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.problemDescryption}</td>
    <td>${badge}</td>
    <td>${mech ? mech.fio : (r.masterFio || '—')}</td>
    <td></td>`;
  const btn = document.createElement('button');
  btn.textContent = 'Открыть';
  btn.className = 'btn btn-outline btn-sm';
  btn.addEventListener('click', () => location.href = `/request-card?id=${r.requestID}`);
  tr.querySelector('td:last-child').appendChild(btn);
  return tr;
}

// Фильтры
document.querySelectorAll('.filter-btn[data-status]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-status]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  });
});
const searchInput = document.getElementById('searchInput');
if (searchInput) searchInput.addEventListener('input', applyFilters);

function applyFilters() {
  const activeBtn = document.querySelector('.filter-btn.active[data-status]');
  const status = activeBtn ? activeBtn.dataset.status : 'all';
  const q = (searchInput ? searchInput.value : '').toLowerCase();
  const filtered = allRequests.filter(r => {
    const matchStatus = status === 'all' || (statusMap[status] || []).includes(r.requestStatus);
    const matchQ = !q || String(r.requestID).includes(q)
      || (r.carModel||'').toLowerCase().includes(q)
      || (r.clientFio||'').toLowerCase().includes(q)
      || (r.problemDescryption||'').toLowerCase().includes(q);
    return matchStatus && matchQ;
  });
  renderRequests(filtered);
}

// Новая заявка
document.getElementById('btnNewReq').addEventListener('click', async () => {
  // Если пользователи ещё не загружены — загрузить
  if (allUsers.length === 0) await loadData();

  const modal = document.getElementById('newReqModal');

  // Фильтруем клиентов: тип 'Заказчик' или 'client' после нормализации
  const clients = allUsers.filter(u => u._normType === 'client');

  const sel = document.getElementById('nrClientSel');
  if (clients.length === 0) {
    sel.innerHTML = '<option value="">— Нет заказчиков —</option>';
  } else {
    sel.innerHTML = '<option value="">— Выберите клиента —</option>' +
      clients.map(c => `<option value="${c.userID}">${c.fio}</option>`).join('');
  }

  // Сбросить форму
  document.getElementById('nrCarModel').value  = '';
  document.getElementById('nrProblem').value   = '';
  document.getElementById('nrErr').textContent = '';

  modal.classList.remove('hidden');
});

document.getElementById('nrCancelBtn').addEventListener('click', () =>
  document.getElementById('newReqModal').classList.add('hidden'));

document.getElementById('newReqModal').addEventListener('click', e => {
  if (e.target === document.getElementById('newReqModal'))
    document.getElementById('newReqModal').classList.add('hidden');
});

document.getElementById('nrSaveBtn').addEventListener('click', async () => {
  const clientID           = parseInt(document.getElementById('nrClientSel').value);
  const carType            = document.getElementById('nrCarType').value;
  const carModel           = document.getElementById('nrCarModel').value.trim();
  const problemDescryption = document.getElementById('nrProblem').value.trim();
  const errEl              = document.getElementById('nrErr');
  if (!clientID)           { errEl.textContent = 'Выберите клиента'; return; }
  if (!carModel)           { errEl.textContent = 'Укажите модель'; return; }
  if (!problemDescryption) { errEl.textContent = 'Опишите проблему'; return; }

  const res = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: new Date().toISOString().split('T')[0],
      carType, carModel, problemDescryption,
      requestStatus: 'Новая заявка', clientID
    })
  });
  if (res.ok) {
    document.getElementById('newReqModal').classList.add('hidden');
    await loadData();
  } else errEl.textContent = 'Ошибка создания заявки';
});

initSidebar();
loadData();
