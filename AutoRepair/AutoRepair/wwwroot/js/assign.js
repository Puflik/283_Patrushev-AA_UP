// assign.js
document.addEventListener('DOMContentLoaded', async () => {
  initSidebar();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = '/requests'; return; }

  document.getElementById('backLink').innerHTML =
    `<a href="/request-card?id=${id}">← Назад к заявке #${id}</a>`;

  const [rRes, uRes] = await Promise.all([
    fetch(`/api/requests/${id}`),
    fetch('/api/users')
  ]);
  if (!rRes.ok) { showError('Заявка не найдена'); return; }

  const req   = await rRes.json();
  const users = uRes.ok ? await uRes.json() : [];

  // Фильтруем механиков по нормализованному типу
  const mechs = users.filter(u => normalizeType(u.type) === 'mechanic');

  // Сводка по заявке
  document.getElementById('aReqId').textContent      = `#${req.requestID}`;
  document.getElementById('aReqStatus').innerHTML    = `<span class="badge ${statusBadgeClass(req.requestStatus)}">${statusLabel(req.requestStatus)}</span>`;
  document.getElementById('aReqCar').textContent     = `${req.carType} · ${req.carModel}`;
  document.getElementById('aReqProblem').textContent = req.problemDescryption;

  // Карточки механиков
  const container = document.getElementById('mechCards');
  if (mechs.length === 0) {
    container.innerHTML = '<p class="text-muted">Нет доступных механиков</p>';
  }
  mechs.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;
             display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${initials(m.fio)}
        </div>
        <div>
          <div class="font-bold">${m.fio}</div>
          <div class="text-muted text-sm">${roleLabel(normalizeType(m.type))}</div>
        </div>
      </div>`;
    card.addEventListener('click', () => {
      document.querySelectorAll('#mechCards .card').forEach(c =>
        c.style.borderColor = '');
      card.style.borderColor = 'var(--accent)';
      document.getElementById('selectedMechName').value = m.fio;
      document.getElementById('selectedMechId').value   = m.userID;
    });
    container.appendChild(card);
  });

  document.getElementById('confirmAssignBtn').addEventListener('click', async () => {
    const mechId   = document.getElementById('selectedMechId').value;
    const deadline = document.getElementById('assignDeadline').value;
    if (!mechId) { showWarning('Выберите механика'); return; }

    const body = { masterID: parseInt(mechId), requestStatus: 'В процессе ремонта' };
    if (deadline) body.completionDate = deadline;

    const res = await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) location.href = `/request-card?id=${id}`;
    else showError('Ошибка назначения');
  });

  document.getElementById('cancelAssignBtn').addEventListener('click', () =>
    location.href = `/request-card?id=${id}`);
});
