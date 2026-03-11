// messages.js
let allMessages = [];

async function loadMessages() {
  const res = await fetch('/api/messages');
  if (!res.ok) { showError('Ошибка загрузки'); return; }
  allMessages = await res.json();
  renderMessages();
}

function renderMessages() {
  const el    = document.getElementById('msgList');
  const badge = document.getElementById('unreadBadge');
  const unread = allMessages.filter(m => !m.isRead).length;
  badge.textContent = unread > 0 ? `${unread} непрочитанных` : '';

  if (allMessages.length === 0) {
    el.innerHTML = '<p class="text-muted">Сообщений нет</p>';
    return;
  }

  el.innerHTML = allMessages.map(m => `
    <div class="card mb-12" style="cursor:pointer;border-left:4px solid ${m.isRead ? 'var(--border)' : 'var(--accent)'};"
         onclick="openMsg(${m.messageID})">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div class="font-bold">${m.clientFio || '—'}</div>
        <div class="text-xs text-muted">${m.sentAt || ''}</div>
      </div>
      <div class="font-medium text-sm">${m.subject || ''}</div>
      <div class="text-muted text-sm" style="margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.messageText || ''}</div>
      <div style="margin-top:8px;">
        ${m.reply
          ? '<span class="badge badge-done">Отвечено</span>'
          : '<span class="badge badge-wait">Ожидает ответа</span>'}
      </div>
    </div>`).join('');
}

window.openMsg = function(id) {
  const m = allMessages.find(x => x.messageID === id);
  if (!m) return;

  const modal  = document.getElementById('msgModal');
  const title  = document.getElementById('msgModalTitle');
  const body   = document.getElementById('msgModalBody');
  const footer = document.getElementById('msgModalFooter');

  title.textContent = m.subject || 'Сообщение';

  body.innerHTML = `
    <div class="text-sm text-muted" style="margin-bottom:8px;">
      От: <b>${m.clientFio || '—'}</b>${m.sentAt ? ' · ' + m.sentAt : ''}
    </div>
    <div style="padding:12px;background:var(--bg);border-radius:var(--radius-sm);font-size:.9rem;line-height:1.55;margin-bottom:12px;">
      ${m.messageText || ''}
    </div>
    ${m.reply
      ? `<div style="padding:12px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:4px;">
           <b style="font-size:.75rem;color:#16a34a;">ВАШ ОТВЕТ</b>
           <div style="font-size:.9rem;margin-top:4px;">${m.reply}</div>
         </div>`
      : `<div class="form-group">
           <label>Ответить клиенту</label>
           <textarea id="replyText" rows="4" placeholder="Введите ответ..."></textarea>
         </div>`}`;

  // Кнопки
  footer.innerHTML = '';

  if (!m.reply) {
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Отправить ответ';
    sendBtn.className = 'btn btn-primary';
    sendBtn.onclick = async () => {
      const txt = (document.getElementById('replyText') || {}).value || '';
      if (!txt.trim()) { showWarning('Введите текст ответа'); return; }
      const res = await fetch(`/api/messages/${id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: txt.trim() })
      });
      if (res.ok) {
        m.reply  = txt.trim();
        m.isRead = true;
        modal.classList.add('hidden');
        renderMessages();
      } else showError('Ошибка отправки');
    };
    footer.appendChild(sendBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Закрыть';
  closeBtn.className = 'btn btn-ghost';
  closeBtn.onclick = () => modal.classList.add('hidden');
  footer.appendChild(closeBtn);

  // Пометить прочитанным (не блокируем показ)
  if (!m.isRead) {
    fetch(`/api/messages/${id}/read`, { method: 'PUT' }).catch(() => {});
    m.isRead = true;
    renderMessages();
  }

  modal.classList.remove('hidden');
};

// Закрытие по клику на фон
document.getElementById('msgModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

initSidebar();
loadMessages();
