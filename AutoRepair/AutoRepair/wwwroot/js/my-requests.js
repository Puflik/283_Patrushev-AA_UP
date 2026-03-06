// my-requests.js
let allRequests = [];

async function getRequests() {
  const res = await fetch('/api/requests', { headers: { 'Accept': 'application/json' } });
  if (res.ok) {
    allRequests = await res.json();
    renderRequests(allRequests);
  } else {
    showError('Ошибка загрузки заявок');
  }
}

function renderRequests(list) {
  const tbody = document.querySelector('#t1 tbody');
  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">Заявки не найдены</td></tr>';
    return;
  }
  list.forEach(r => tbody.append(row(r)));
}

function row(r) {
  const tr = document.createElement('tr');
  const badge = `<span class="badge ${statusBadgeClass(r.requestStatus)}">${statusLabel(r.requestStatus)}</span>`;
  tr.innerHTML = `
    <td>${r.requestID}</td>
    <td>${formatDate(r.startDate)}</td>
    <td>${r.carType}</td>
    <td>${r.carModel}</td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.problemDescryption}</td>
    <td>${badge}</td>
    <td></td>`;
  const btn = document.createElement('button');
  btn.textContent = 'Открыть';
  btn.className = 'btn btn-outline btn-sm';
  btn.addEventListener('click', () => location.href = `/request-detail?id=${r.requestID}`);
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
      || (r.problemDescryption||'').toLowerCase().includes(q);
    return matchStatus && matchQ;
  });
  renderRequests(filtered);
}

initClientNav();
getRequests();
