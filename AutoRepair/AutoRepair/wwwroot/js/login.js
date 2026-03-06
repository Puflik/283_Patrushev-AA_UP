// login.js
function showLoginForm() {
  document.getElementById('formLogin').classList.remove('hidden');
  document.getElementById('formRegister').classList.add('hidden');
  document.getElementById('tabLogin').classList.add('active');
  document.getElementById('tabRegister').classList.remove('active');
  document.getElementById('errorMsg').textContent = '';
  document.getElementById('errorMsgReg').textContent = '';
  document.getElementById('userLogin').value = '';
  document.getElementById('userPassword').value = '';
}

function showRegisterForm() {
  document.getElementById('formLogin').classList.add('hidden');
  document.getElementById('formRegister').classList.remove('hidden');
  document.getElementById('tabLogin').classList.remove('active');
  document.getElementById('tabRegister').classList.add('active');
  document.getElementById('regFio').value = '';
  document.getElementById('regPhone').value = '';
  document.getElementById('regLogin').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('errorMsg').textContent = '';
  document.getElementById('errorMsgReg').textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tabLogin').addEventListener('click', showLoginForm);
  document.getElementById('tabRegister').addEventListener('click', showRegisterForm);
  document.getElementById('linkToRegister').addEventListener('click', e => { e.preventDefault(); showRegisterForm(); });
  document.getElementById('linkToLogin').addEventListener('click', e => { e.preventDefault(); showLoginForm(); });

  async function doLogin() {
    const login    = document.getElementById('userLogin').value.trim();
    const password = document.getElementById('userPassword').value;
    if (!login || !password) {
      document.getElementById('errorMsg').textContent = 'Заполните все поля';
      return;
    }
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    if (response.ok) {
      const user = await response.json();
      // Нормализуем тип для редиректа (в БД: Заказчик, Автомеханик и т.д.)
      const type = normalizeType(user.type);
      location.href = type === 'client' ? '/my-requests' : '/requests';
    } else {
      const err = await response.json();
      document.getElementById('errorMsg').textContent = err.message || 'Ошибка входа';
    }
  }

  document.getElementById('saveBtn').addEventListener('click', doLogin);
  document.getElementById('userPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  async function doRegister() {
    const fio      = document.getElementById('regFio').value.trim();
    const phone    = document.getElementById('regPhone').value.trim();
    const login    = document.getElementById('regLogin').value.trim();
    const password = document.getElementById('regPassword').value;
    const errEl    = document.getElementById('errorMsgReg');
    if (!fio || !login || !password) { errEl.textContent = 'Заполните обязательные поля'; return; }

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fio, phone, login, password, type: 'Заказчик' })
    });
    if (response.ok) {
      showLoginForm();
      setTimeout(() => alert('Регистрация прошла успешно. Войдите.'), 50);
    } else {
      const err = await response.json();
      errEl.textContent = err.message || 'Ошибка регистрации';
    }
  }

  document.getElementById('regBtn').addEventListener('click', doRegister);
  showLoginForm();
});
