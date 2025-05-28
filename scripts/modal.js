document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const closeBtns = document.querySelectorAll('.modal-close');

  if (!loginBtn || !registerBtn || !loginModal || !registerModal) {
    console.warn('❗ Modal elements not found in DOM');
    return;
  }

  loginBtn.addEventListener('click', () => {
    console.log('🟢 Открытие loginModal');
    loginModal.classList.add('active');
    loginModal.removeAttribute('hidden');
    loginModal.style.display = 'flex';
  });

  registerBtn.addEventListener('click', () => {
    console.log('🟢 Открытие registerModal');
    registerModal.classList.add('active');
    registerModal.removeAttribute('hidden');
    registerModal.style.display = 'flex';
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        console.log('❌ Закрытие модалки');
        modal.classList.remove('active');
        modal.setAttribute('hidden', '');
        modal.style.display = 'none';
      }
    });
  });

  const loginForm = loginModal.querySelector('#loginForm');
  if (loginForm && !loginForm.dataset.listenerAttached) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('🧪 Проверка наличия window.handleLoginForm...');

      if (typeof window.handleLoginForm === 'function') {
        console.log('✅ window.handleLoginForm существует, вызываем...');
        await window.handleLoginForm(e);
      } else {
        console.error('❌ window.handleLoginForm не определён на момент submit');
      }
    });
    loginForm.dataset.listenerAttached = 'true';
  }
});
// 📥 Авторизация
window.handleLoginForm = async (e) => {
  const form = e.target;
  const email = form.modalEmail.value;
  const password = form.modalPassword.value;

  try {
    const res = await fetch('https://macapp.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка входа');

    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    document.body.classList.add('logged-in');

    alert('🎉 Вход выполнен');
    location.reload();
  } catch (err) {
    alert('❌ Ошибка: ' + err.message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const closeBtns = document.querySelectorAll('.modal-close');

  if (!loginBtn || !registerBtn || !loginModal || !registerModal) {
    console.warn('❗ Modal elements not found in DOM');
    return;
  }

  // Открытие модалок
  loginBtn.addEventListener('click', () => {
    loginModal.classList.add('active');
    loginModal.removeAttribute('hidden');
    loginModal.style.display = 'flex';
  });

  registerBtn.addEventListener('click', () => {
    registerModal.classList.add('active');
    registerModal.removeAttribute('hidden');
    registerModal.style.display = 'flex';
  });

  // Закрытие
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('hidden', '');
        modal.style.display = 'none';
      }
    });
  });

  // 🧾 Обработка входа
  const loginForm = loginModal.querySelector('#loginForm');
  if (loginForm && !loginForm.dataset.listenerAttached) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (typeof window.handleLoginForm === 'function') {
        await window.handleLoginForm(e);
      }
    });
    loginForm.dataset.listenerAttached = 'true';
  }

  // 🆕 Обработка регистрации
  const registerForm = document.getElementById('registerForm');
  if (registerForm && !registerForm.dataset.listenerAttached) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = registerForm.rEmail.value;
      const password = registerForm.rPassword.value;

      try {
        const res = await fetch('https://macapp.onrender.com/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Ошибка регистрации');

        alert('✅ Регистрация успешна. Теперь войдите.');
        registerForm.reset();

        registerModal.style.display = 'none';
        registerModal.setAttribute('hidden', '');
        loginModal.style.display = 'flex';
        loginModal.removeAttribute('hidden');
      } catch (err) {
        alert('❌ Ошибка: ' + err.message);
      }
    });
    registerForm.dataset.listenerAttached = 'true';
  }
});
