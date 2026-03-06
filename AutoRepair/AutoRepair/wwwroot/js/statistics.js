// statistics.js
let currentPeriod = 'month';

async function loadStats(period) {
  currentPeriod = period;
  const res = await fetch(`/api/statistics?period=${period}`);
  if (!res.ok) { showError('Ошибка загрузки статистики'); return; }
  const data = await res.json();

  document.getElementById('statDone').textContent    = data.done;
  document.getElementById('statAvgTime').textContent = data.avgDays != null ? data.avgDays + ' дн' : '—';
  document.getElementById('statTotal').textContent   = data.newClients;
  document.getElementById('statWaiting').textContent = data.waiting;

  // Bar chart
  const barChart  = document.getElementById('barChart');
  const barLabels = document.getElementById('barLabels');
  barChart.innerHTML = barLabels.innerHTML = '';
  const bars   = data.bars || [];
  const maxVal = Math.max(...bars.map(b => b.cnt), 1);
  bars.forEach(b => {
    const bar = document.createElement('div');
    bar.style.cssText = `flex:1;background:var(--accent);border-radius:4px 4px 0 0;
      height:${(b.cnt/maxVal*100)}%;min-height:4px;position:relative;`;
    const tip = document.createElement('span');
    tip.textContent = b.cnt;
    tip.style.cssText = 'position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:.72rem;font-weight:600;';
    bar.append(tip);
    barChart.append(bar);

    const lbl = document.createElement('div');
    lbl.style.cssText = 'flex:1;text-align:center;font-size:.65rem;color:var(--muted);';
    lbl.textContent = b.day;
    barLabels.append(lbl);
  });
  if (bars.length === 0) {
    barChart.innerHTML = '<div style="color:var(--muted);font-size:.85rem;padding:20px;">Нет данных за период</div>';
  }

  // Механики
  const tbody = document.querySelector('#t1 tbody');
  tbody.innerHTML = '';
  (data.mechanics || []).forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.fio}</td>
      <td>${m.doneCnt}</td>
      <td>${m.avgDays != null ? m.avgDays + ' дн' : '—'}</td>
      <td>${m.lastDate || '—'}</td>`;
    tbody.append(tr);
  });

  // Типы неисправностей — получим из отдельного запроса заявок
  loadIssues();
}

async function loadIssues() {
  const res = await fetch('/api/requests');
  if (!res.ok) return;
  const reqs = await res.json();
  const counts = {};
  reqs.forEach(r => {
    const key = r.problemDescryption ? r.problemDescryption.substring(0, 40) : 'Не указано';
    counts[key] = (counts[key] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5);
  const total  = reqs.length || 1;
  const el     = document.getElementById('issuesList');
  el.innerHTML = sorted.map(([label, cnt]) => {
    const pct = Math.round(cnt/total*100);
    return `<div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px;">
        <span>${label}</span><span>${pct}%</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:3px;">
        <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:3px;"></div>
      </div></div>`;
  }).join('');
}

// Переключение периода
document.querySelectorAll('#periodPills .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#periodPills .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadStats(btn.dataset.p);
  });
});

initSidebar();
loadStats('month');
