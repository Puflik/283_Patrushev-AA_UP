// request-detail.js
document.addEventListener('DOMContentLoaded', async () => {
  initClientNav();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = '/my-requests'; return; }

  const [reqRes, cmtRes] = await Promise.all([
    fetch(`/api/requests/${id}`),
    fetch(`/api/comments?requestID=${id}`)
  ]);
  if (!reqRes.ok) { showError('Заявка не найдена'); return; }

  const r   = await reqRes.json();
  const cmts = cmtRes.ok ? await cmtRes.json() : [];

  // Заголовок
  document.getElementById('pageTitle').textContent = `Заявка #${r.requestID}`;
  const badge = document.getElementById('statusBadge');
  badge.textContent = statusLabel(r.requestStatus);
  badge.className   = 'badge ' + statusBadgeClass(r.requestStatus);

  // Поля
  document.getElementById('startDate').value          = formatDate(r.startDate);
  document.getElementById('completionDate').value     = r.completionDate ? formatDate(r.completionDate) : '—';
  document.getElementById('carType').value            = r.carType;
  document.getElementById('carModel').value           = r.carModel;
  document.getElementById('problemDescryption').value = r.problemDescryption;
  document.getElementById('repairParts').value        = r.repairParts || '—';

  // Механик
  document.getElementById('mechInfo').textContent =
    r.masterFio ? r.masterFio : 'Механик ещё не назначен';

  // История (имитация через статус)
  const hist = document.getElementById('historyList');
  hist.innerHTML = `
    <div class="timeline-item">
      <div class="timeline-dot timeline-dot--accent"></div>
      <div><div class="timeline-event">Заявка создана</div><div class="timeline-time">${formatDate(r.startDate)}</div></div>
    </div>
    ${r.masterFio ? `<div class="timeline-item">
      <div class="timeline-dot timeline-dot--work"></div>
      <div><div class="timeline-event">Назначен механик: ${r.masterFio}</div></div>
    </div>` : ''}
    ${r.requestStatus === 'Готова к выдаче' ? `<div class="timeline-item">
      <div class="timeline-dot timeline-dot--done"></div>
      <div><div class="timeline-event">Ремонт завершён</div><div class="timeline-time">${formatDate(r.completionDate)}</div></div>
    </div>` : ''}`;

  // Комментарии
  const cmtEl = document.getElementById('commentsList');
  if (cmts.length > 0) {
    cmtEl.innerHTML = cmts.map(c => `
      <div class="card mb-12" style="padding:12px 16px;">
        <div class="font-bold text-sm">${c.masterFio}</div>
        <div class="text-sm mt-4">${c.message}</div>
      </div>`).join('');
  }

  // Кнопка отмены
  const cancelBtn  = document.getElementById('cancelBtn');
  const cancelNote = document.getElementById('cancelNote');
  if (r.requestStatus === 'Новая заявка') {
    cancelBtn.addEventListener('click', async () => {
      if (!await confirmAction('Вы уверены, что хотите отменить заявку?')) return;
      const res = await fetch(`/api/requests/${r.requestID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestStatus: 'Отменена' })
      });
      if (res.ok) location.href = '/my-requests';
      else showError('Не удалось отменить заявку');
    });
  } else {
    cancelBtn.disabled = true;
    cancelBtn.style.opacity = '.4';
    cancelNote.textContent = 'Отмена возможна только для заявок со статусом «Новая заявка»';
  }
});
