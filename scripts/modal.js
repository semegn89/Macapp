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

// 📥 Login form validation
document.getElementById('loginForm')?.addEventListener('submit', e => {
  const form = e.target;
  clearErrors(form);
  const email = form.modalEmail;
  const password = form.modalPassword;
  let valid = true;

  if (!validateEmail(email.value)) {
    markInvalid(email, 'Введите корректный email');
    valid = false;
  }
  if (password.value.length < 6) {
    markInvalid(password, 'Пароль должен быть не менее 6 символов');
    valid = false;
  }

  if (!valid) e.preventDefault();
});

// 🆕 Register form validation
document.getElementById('registerForm')?.addEventListener('submit', e => {
  const form = e.target;
  clearErrors(form);
  const email = form.rEmail;
  const pass1 = form.rPassword;
  const pass2 = form.rPassword2;
  let valid = true;

  if (!validateEmail(email.value)) {
    markInvalid(email, 'Введите корректный email');
    valid = false;
  }
  if (pass1.value.length < 6) {
    markInvalid(pass1, 'Пароль слишком короткий');
    valid = false;
  }
  if (pass1.value !== pass2.value) {
    markInvalid(pass2, 'Пароли не совпадают');
    valid = false;
  }

  if (!valid) e.preventDefault();
});
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const switchToLoginBtn = document.getElementById('switchToLogin');
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

  if (switchToLoginBtn && loginModal && registerModal) {
    switchToLoginBtn.addEventListener('click', () => {
      registerModal.classList.remove('active');
      registerModal.setAttribute('hidden', '');
      registerModal.style.display = 'none';

      loginModal.classList.add('active');
      loginModal.removeAttribute('hidden');
      loginModal.style.display = 'flex';
    });
  }
  const switchToRegisterBtn = document.getElementById('switchToRegister');

if (switchToRegisterBtn && loginModal && registerModal) {
  switchToRegisterBtn.addEventListener('click', () => {
    loginModal.classList.remove('active');
    loginModal.setAttribute('hidden', '');
    loginModal.style.display = 'none';

    registerModal.classList.add('active');
    registerModal.removeAttribute('hidden');
    registerModal.style.display = 'flex';
  });
}

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
