function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function markInvalid(input, message) {
  input.classList.add('input-error');
  let error = input.parentElement.querySelector('.error-msg');
  if (!error) {
    error = document.createElement('small');
    error.className = 'error-msg';
    input.parentElement.appendChild(error);
  }
  error.textContent = message;
  error.style.display = 'block';
}

function clearErrors(form) {
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  form.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
}

// === Авторизация ===
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

// === Регистрация ===
window.handleRegisterForm = async (e) => {
  const form = e.target;
  clearErrors(form);

  const email = form.rEmail.value;
  const pass1 = form.rPassword.value;
  const pass2 = form.rPassword2.value;

  let valid = true;

  if (!validateEmail(email)) {
    markInvalid(form.rEmail, 'Введите корректный email');
    valid = false;
  }
  if (pass1.length < 6) {
    markInvalid(form.rPassword, 'Пароль слишком короткий');
    valid = false;
  }
  if (pass1 !== pass2) {
    markInvalid(form.rPassword2, 'Пароли не совпадают');
    valid = false;
  }

  if (!valid) return;

  try {
    const res = await fetch('https://macapp.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass1 })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка регистрации');

    alert('✅ Регистрация успешна. Теперь войдите.');
    form.reset();

    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerModal').setAttribute('hidden', '');
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginModal').removeAttribute('hidden');
  } catch (err) {
    alert('❌ Ошибка: ' + err.message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const switchToLoginBtn = document.getElementById('switchToLogin');
  const switchToRegisterBtn = document.getElementById('switchToRegister');
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

  // Переключение между модалками
  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener('click', () => {
      registerModal.classList.remove('active');
      registerModal.setAttribute('hidden', '');
      registerModal.style.display = 'none';

      loginModal.classList.add('active');
      loginModal.removeAttribute('hidden');
      loginModal.style.display = 'flex';
    });
  }

  if (switchToRegisterBtn) {
    switchToRegisterBtn.addEventListener('click', () => {
      loginModal.classList.remove('active');
      loginModal.setAttribute('hidden', '');
      loginModal.style.display = 'none';

      registerModal.classList.add('active');
      registerModal.removeAttribute('hidden');
      registerModal.style.display = 'flex';
    });
  }

  // Закрытие модалок
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

  // Обработка login
  const loginForm = loginModal.querySelector('#loginForm');
  if (loginForm && !loginForm.dataset.listenerAttached) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await window.handleLoginForm(e);
    });
    loginForm.dataset.listenerAttached = 'true';
  }

  // Обработка register
  const registerForm = document.getElementById('registerForm');
  if (registerForm && !registerForm.dataset.listenerAttached) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      await window.handleRegisterForm(e);
    });
    registerForm.dataset.listenerAttached = 'true';
  }
});
