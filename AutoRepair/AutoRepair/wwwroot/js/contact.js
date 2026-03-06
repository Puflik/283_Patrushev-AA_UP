// contact.js
document.addEventListener('DOMContentLoaded', async () => {
  // ФИО — страница требует авторизации, получаем пользователя
  const user = await getCurrentUser();
  if (user) {
    const nameEl   = document.getElementById('navName');
    const avatarEl = document.getElementById('navAvatar');
    if (nameEl)   nameEl.textContent   = user.fio;
    if (avatarEl) avatarEl.textContent = initials(user.fio);
  }

  // QR-код
  const qrEl = document.getElementById('qr2');
  if (qrEl && typeof QRCode !== 'undefined') {
    new QRCode(qrEl, {
      text: 'https://docs.google.com/forms/d/e/1FAIpQLSdhZcExx6LSIXxk0ub55mSu-WIh23WYdGG9HY5EZhLDo7P8eA/viewform?usp=sf_link',
      width: 130,
      height: 130,
      colorDark: '#111',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // Очистить форму
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('subject').value      = '';
    document.getElementById('messageText').value  = '';
    document.getElementById('msgErr').textContent = '';
  });

  // Отправить сообщение
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const subject     = document.getElementById('subject').value.trim();
    const messageText = document.getElementById('messageText').value.trim();
    const errEl       = document.getElementById('msgErr');

    if (!subject)     { errEl.textContent = 'Укажите тему обращения'; return; }
    if (!messageText) { errEl.textContent = 'Введите текст сообщения'; return; }

    // Берём пользователя из кеша (уже загружен выше)
    const u = await getCurrentUser();
    if (!u) { errEl.textContent = 'Необходимо войти в систему'; return; }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, messageText, clientID: u.userID })
    });

    if (res.ok) {
      showInfo('Сообщение отправлено! Менеджер свяжется с вами в течение рабочего дня.');
      document.getElementById('subject').value      = '';
      document.getElementById('messageText').value  = '';
      errEl.textContent = '';
    } else {
      errEl.textContent = 'Не удалось отправить сообщение. Попробуйте позже.';
    }
  });
});
