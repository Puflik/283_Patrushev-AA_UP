// profile.js
document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) return;
  initClientNav();

  // Заполнить профиль
  document.getElementById('profileAvatar').textContent = initials(user.fio);
  document.getElementById('profileName').textContent   = user.fio;
  document.getElementById('profileMeta').textContent   = roleLabel(user.type) + (user.phone ? '  ·  ' + user.phone : '');

  // Редактирование
  document.getElementById('toggleEditBtn').addEventListener('click', () => {
    const form = document.getElementById('editForm');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      document.getElementById('userID').value    = user.userID;
      document.getElementById('userFio').value   = user.fio;
      document.getElementById('userPhone').value = user.phone;
      document.getElementById('userLogin').value = user.login;
      document.getElementById('userPassword').value = '';
    }
  });
  document.getElementById('cancelEditBtn').addEventListener('click', () =>
    document.getElementById('editForm').classList.add('hidden'));

  document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const body = {
      fio:      document.getElementById('userFio').value.trim(),
      phone:    document.getElementById('userPhone').value.trim(),
      login:    document.getElementById('userLogin').value.trim(),
      password: document.getElementById('userPassword').value
    };
    const r = await fetch(`/api/users/${user.userID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (r.ok) {
      showInfo('Данные обновлены. Перезагрузите страницу.');
      document.getElementById('editForm').classList.add('hidden');
    } else showError('Не удалось сохранить');
  });

  // Сводка по заявкам
  const reqRes = await fetch('/api/requests');
  if (reqRes.ok) {
    const reqs = await reqRes.json();
    document.getElementById('statTotal').textContent     = reqs.length;
    document.getElementById('statDone').textContent      = reqs.filter(r => r.requestStatus === 'Готова к выдаче').length;
    document.getElementById('statActive').textContent    = reqs.filter(r =>
      ['Новая заявка','В процессе ремонта','Ожидание автозапчастей'].includes(r.requestStatus)).length;
    document.getElementById('statCancelled').textContent = reqs.filter(r => r.requestStatus === 'Отменена').length;
  }

  // Уведомления (ответы на сообщения)
  const msgRes = await fetch('/api/messages');
  const notifEl = document.getElementById('notifList');
  if (msgRes.ok) {
    const msgs = await msgRes.json();
    const replied = msgs.filter(m => m.reply);
    if (replied.length === 0) {
      notifEl.innerHTML = '<p class="text-muted text-sm">Нет новых уведомлений</p>';
    } else {
      notifEl.innerHTML = replied.map(m => `
        <div class="card mb-16" style="border-left:4px solid var(--accent);">
          <div class="font-bold mb-8">${m.subject}</div>
          <div class="text-sm text-muted mb-8">Ваш вопрос: ${m.messageText}</div>
          <div class="text-sm" style="background:var(--bg);padding:10px 14px;border-radius:var(--radius-sm);">
            <b>Ответ менеджера:</b> ${m.reply}
          </div>
          <div class="text-xs text-muted mt-8">${formatDate(m.sentAt)}</div>
        </div>`).join('');
    }
  } else {
    notifEl.innerHTML = '<p class="text-muted text-sm">—</p>';
  }
});
