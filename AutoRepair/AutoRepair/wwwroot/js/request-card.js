// request-card.js
document.addEventListener('DOMContentLoaded', async () => {
  initSidebar();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = '/requests'; return; }

  const user = await getCurrentUser();
  if (!user) return;

  async function loadRequest() {
    const [rRes, cRes] = await Promise.all([
      fetch(`/api/requests/${id}`),
      fetch(`/api/comments?requestID=${id}`)
    ]);
    if (!rRes.ok) { showError('Заявка не найдена'); return; }
    const r    = await rRes.json();
    const cmts = cRes.ok ? await cRes.json() : [];
    render(r, cmts);
  }

  function render(r, cmts) {
    document.getElementById('topbarTitle').textContent = `Заявка #${r.requestID}`;
    document.getElementById('pageTitle').textContent   = `Заявка #${r.requestID}`;
    const badge = document.getElementById('statusBadge');
    badge.textContent = statusLabel(r.requestStatus);
    badge.className   = 'badge ' + statusBadgeClass(r.requestStatus);

    document.getElementById('requestID').value          = r.requestID;
    document.getElementById('startDate').value          = formatDate(r.startDate);
    document.getElementById('completionDate').value     = r.completionDate || '';
    document.getElementById('carType').value            = r.carType;
    document.getElementById('carModel').value           = r.carModel;
    document.getElementById('problemDescryption').value = r.problemDescryption;
    document.getElementById('repairParts').value        = r.repairParts || '';
    document.getElementById('clientFio').value          = r.clientFio || '—';
    document.getElementById('clientPhone').value        = r.clientPhone || '—';

    // Статус селект
    document.getElementById('statusSel').value = r.requestStatus;

    // Механик
    const mechEl = document.getElementById('mechInfo');
    mechEl.textContent = r.masterFio ? r.masterFio : 'Механик не назначен';
    const assignBtn = document.getElementById('assignBtn');
    if (['operator','manager','admin'].includes(user.type)) {
      assignBtn.classList.remove('hidden');
      assignBtn.addEventListener('click', () =>
        location.href = `/assign?id=${r.requestID}`);
    }

    // Кнопки по роли
    const deleteBtn  = document.getElementById('deleteBtn');
    const finishBtn  = document.getElementById('finishBtn');
    if (user.type === 'admin') deleteBtn.classList.remove('hidden');
    if (user.type === 'mechanic' && r.requestStatus === 'В процессе ремонта')
      finishBtn.classList.remove('hidden');

    // Комментарии
    const cmtEl = document.getElementById('commentsList');
    cmtEl.innerHTML = cmts.length > 0
      ? cmts.map(c => `<div style="padding:10px;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:8px;">
          <b class="text-sm">${c.masterFio}</b>
          <div class="text-sm mt-4">${c.message}</div>
        </div>`).join('')
      : '<p class="text-muted text-sm">Нет комментариев</p>';

    // Сохранить
    document.getElementById('saveBtn').onclick = async () => {
      const body = {
        requestStatus:  document.getElementById('statusSel').value,
        completionDate: document.getElementById('completionDate').value || null,
        repairParts:    document.getElementById('repairParts').value || null
      };
      const res = await fetch(`/api/requests/${r.requestID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) { showInfo('Сохранено'); await loadRequest(); }
      else showError('Ошибка сохранения');
    };

    // Завершить (механик)
    finishBtn.onclick = async () => {
      const res = await fetch(`/api/requests/${r.requestID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestStatus: 'Готова к выдаче',
          completionDate: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) await loadRequest();
      else showError('Ошибка');
    };

    // Удалить (admin)
    deleteBtn.onclick = async () => {
      if (!await confirmAction('Удалить заявку безвозвратно?')) return;
      const res = await fetch(`/api/requests/${r.requestID}`, { method: 'DELETE' });
      if (res.ok) location.href = '/requests';
      else showError('Ошибка удаления');
    };
  }

  // Добавить комментарий
  document.getElementById('addCommentBtn').addEventListener('click', async () => {
    const text = document.getElementById('newComment').value.trim();
    if (!text) return;
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, masterID: user.userID, requestID: parseInt(id) })
    });
    if (res.ok) {
      document.getElementById('newComment').value = '';
      await loadRequest();
    }
  });

  await loadRequest();
});
