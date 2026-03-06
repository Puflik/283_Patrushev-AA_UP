// create-request.js
document.addEventListener('DOMContentLoaded', async () => {
  initClientNav();

  // QR-код
  if (typeof QRCode !== 'undefined') {
    new QRCode(document.getElementById('qr1'), {
      text: 'https://docs.google.com/forms/d/e/1FAIpQLSdhZcExx6LSIXxk0ub55mSu-WIh23WYdGG9HY5EZhLDo7P8eA/viewform?usp=sf_link',
      width: 120, height: 120,
      colorDark: '#111', colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('carModel').value = '';
    document.getElementById('problemDescryption').value = '';
    document.getElementById('completionDate').value = '';
    document.getElementById('formErr').textContent = '';
  });

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const carType            = document.getElementById('carType').value;
    const carModel           = document.getElementById('carModel').value.trim();
    const problemDescryption = document.getElementById('problemDescryption').value.trim();
    const completionDate     = document.getElementById('completionDate').value;
    const errEl              = document.getElementById('formErr');

    if (!carModel)           { errEl.textContent = 'Укажите модель автомобиля'; return; }
    if (!problemDescryption) { errEl.textContent = 'Опишите проблему';         return; }

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: new Date().toISOString().split('T')[0],
        carType, carModel, problemDescryption,
        requestStatus: 'Новая заявка',
        clientID: user.userID,
        completionDate: completionDate || null
      })
    });
    if (res.ok) {
      location.href = '/my-requests';
    } else {
      errEl.textContent = 'Не удалось создать заявку';
    }
  });
});
