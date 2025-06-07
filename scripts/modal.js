// === Forgot/Reset/Verify modal HTML ===
if (!document.getElementById('forgotModal')) {
  const forgotHtml = `
  <div id="forgotModal" class="modal" role="dialog" hidden style="display:none;">
    <div class="modal-content">
      <button class="modal-close" aria-label="Закрыть" style="position:absolute;top:10px;right:10px;">&times;</button>
      <h2>Восстановление доступа</h2>
      <form id="forgotForm">
        <div class="form-row">
          <label for="forgotEmail">Введите e-mail:</label>
          <input type="email" id="forgotEmail" name="forgotEmail" required>
        </div>
        <button type="submit" class="button">Получить ссылку для сброса</button>
      </form>
      <div id="forgotMsg" style="margin-top:14px;color:#238b00;display:none;"></div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', forgotHtml);
}
if (!document.getElementById('resetModal')) {
  const resetHtml = `
  <div id="resetModal" class="modal" role="dialog" hidden style="display:none;">
    <div class="modal-content">
      <button class="modal-close" aria-label="Закрыть" style="position:absolute;top:10px;right:10px;">&times;</button>
      <h2>Сброс пароля</h2>
      <form id="resetForm">
        <div class="form-row">
          <label for="resetPassword">Новый пароль:</label>
          <input type="password" id="resetPassword" name="resetPassword" required minlength="6">
        </div>
        <button type="submit" class="button">Установить пароль</button>
      </form>
      <div id="resetMsg" style="margin-top:14px;color:#238b00;display:none;"></div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', resetHtml);
}
// === Авторизация ===
window.handleLoginForm = async (e) => {
  const form = e.target;
  const email = form.modalEmail.value;
  const password = form.modalPassword.value;

  try {
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Ошибка входа');
    window.currentUser = data.user;
    window.token = data.token;
    document.body.classList.add('logged-in');
    closeModal(document.getElementById('loginModal'));
    if (typeof renderMainSiteContent === 'function') renderMainSiteContent();
    if (window.loadPage) window.loadPage('payments');
    showToast('🎉 Вход выполнен', 'success');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
};

// === Регистрация (можно оставить, если нужна) ===
window.handleRegisterForm = async (e) => {
  e.preventDefault();
  const form = e.target;

  // Helper function to show error message under a field
  function showError(input, message) {
    input.classList.add('error-border');
    let errorDiv = input.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('field-error')) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.textContent = message;
    errorDiv.style.color = '#c22';
  }

  // Helper function to clear error message
  function clearError(input) {
    input.classList.remove('error-border');
    let errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('field-error')) {
      errorDiv.textContent = '';
    }
  }

  // Get all fields
  const emailInput = form.rEmail;
  const pass1Input = form.rPassword;
  const pass2Input = form.rPassword2;
  const companyNameInput = form.companyName;
  const directorNameInput = form.directorName;
  const innInput = form.inn;
  const addressInput = form.address;
  const bankNameInput = form.bankName;
  const bikInput = form.bik;
  const accountNumberInput = form.accountNumber;
  const contactPhoneInput = form.contactPhone;

  // Clear all previous errors
  [emailInput, pass1Input, pass2Input, companyNameInput, directorNameInput, innInput, addressInput, bankNameInput, bikInput, accountNumberInput, contactPhoneInput].forEach(clearError);

  let hasError = false;

  // Email validation
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    showError(emailInput, 'Email обязателен');
    hasError = true;
  } else if (!emailRegex.test(email)) {
    showError(emailInput, 'Введите корректный email');
    hasError = true;
  }

  // Password validation
  const pass1 = pass1Input.value;
  const pass2 = pass2Input.value;
  if (!pass1) {
    showError(pass1Input, 'Пароль обязателен');
    hasError = true;
  } else if (pass1.length < 6) {
    showError(pass1Input, 'Пароль должен быть не короче 6 символов');
    hasError = true;
  }
  if (!pass2) {
    showError(pass2Input, 'Подтвердите пароль');
    hasError = true;
  } else if (pass1 !== pass2) {
    showError(pass2Input, 'Пароли не совпадают');
    hasError = true;
  }

  // companyName not empty
  if (!companyNameInput.value.trim()) {
    showError(companyNameInput, 'Название компании обязательно');
    hasError = true;
  }

  // directorName not empty
  if (!directorNameInput.value.trim()) {
    showError(directorNameInput, 'ФИО директора обязательно');
    hasError = true;
  }

  // inn validation: digits only, length 10 or 12
  const inn = innInput.value.trim();
  if (!inn) {
    showError(innInput, 'ИНН обязателен');
    hasError = true;
  } else if (!/^\d{10}$/.test(inn) && !/^\d{12}$/.test(inn)) {
    showError(innInput, 'ИНН должен содержать 10 или 12 цифр');
    hasError = true;
  }

  // address not empty
  if (!addressInput.value.trim()) {
    showError(addressInput, 'Адрес обязателен');
    hasError = true;
  }

  // bankName not empty
  if (!bankNameInput.value.trim()) {
    showError(bankNameInput, 'Название банка обязательно');
    hasError = true;
  }

  // bik validation: exactly 9 digits
  const bik = bikInput.value.trim();
  if (!bik) {
    showError(bikInput, 'БИК обязателен');
    hasError = true;
  } else if (!/^\d{9}$/.test(bik)) {
    showError(bikInput, 'БИК должен содержать ровно 9 цифр');
    hasError = true;
  }

  // accountNumber validation: digits only, length 20
  const accountNumber = accountNumberInput.value.trim();
  if (!accountNumber) {
    showError(accountNumberInput, 'Номер счёта обязателен');
    hasError = true;
  } else if (!/^\d{20}$/.test(accountNumber)) {
    showError(accountNumberInput, 'Номер счёта должен содержать ровно 20 цифр');
    hasError = true;
  }

  // contactPhone not empty
  if (!contactPhoneInput.value.trim()) {
    showError(contactPhoneInput, 'Контактный телефон обязателен');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  try {
    const res = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email,
        password: pass1,
        companyName: companyNameInput.value.trim(),
        directorName: directorNameInput.value.trim(),
        inn,
        address: addressInput.value.trim(),
        bankName: bankNameInput.value.trim(),
        bik,
        accountNumber,
        contactPhone: contactPhoneInput.value.trim()
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Ошибка регистрации');
    alert('✅ Регистрация успешна. Теперь войдите.');
    form.reset();
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerModal').setAttribute('hidden', '');
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginModal').removeAttribute('hidden');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
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
      await window.handleRegisterForm(e);
    });
    registerForm.dataset.listenerAttached = 'true';
  }

  // --- Forgot password (открытие модалки) ---
  document.querySelectorAll('.forgot-password').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      if (document.getElementById('loginModal')) document.getElementById('loginModal').style.display = 'none';
      const modal = document.getElementById('forgotModal');
      modal.style.display = 'flex';
      modal.removeAttribute('hidden');
    });
  });

  // Закрытие forgot/reset
  document.querySelectorAll('#forgotModal .modal-close, #resetModal .modal-close').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const modal = btn.closest('.modal');
      if(modal) {
        modal.style.display = 'none';
        modal.setAttribute('hidden', '');
      }
    });
  });

  // --- Forgot form обработка ---
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm && !forgotForm.dataset.listenerAttached) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = forgotForm.forgotEmail.value;
      const msgEl = document.getElementById('forgotMsg');
      msgEl.style.color = '#238b00';
      msgEl.style.display = 'none';
      try {
        const res = await fetch('http://localhost:5001/api/auth/forgot', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'Ошибка отправки');
        msgEl.textContent = 'Письмо отправлено! Проверьте почту.';
        msgEl.style.color = '#238b00';
        msgEl.style.display = '';
      } catch (err) {
        msgEl.textContent = err.message;
        msgEl.style.color = '#c22';
        msgEl.style.display = '';
      }
    });
    forgotForm.dataset.listenerAttached = 'true';
  }

  // --- Проверка токена подтверждения почты ---
  const params = new URLSearchParams(location.search);
  if (params.has('verify')) {
    fetch('http://localhost:5001/api/auth/verify?token=' + encodeURIComponent(params.get('verify')))
      .then(r=>r.json())
      .then(data=>{
        if (data.success) showToast('Почта подтверждена!', 'success');
        else showToast(data.message || 'Ошибка подтверждения почты', 'error');
      });
  }

  // --- Вход по ссылке сброса пароля ---
  if (params.has('reset')) {
    window.openResetModal(params.get('reset'));
  }
});

// --- Сброс пароля по токену ---
window.openResetModal = function(token) {
  const modal = document.getElementById('resetModal');
  modal.style.display = 'flex';
  modal.removeAttribute('hidden');
  const resetForm = document.getElementById('resetForm');
  const msgEl = document.getElementById('resetMsg');
  msgEl.textContent = '';
  msgEl.style.display = 'none';
  resetForm.onsubmit = async (e) => {
    e.preventDefault();
    const password = resetForm.resetPassword.value;
    msgEl.style.color = '#238b00';
    msgEl.style.display = 'none';
  try {
    const res = await fetch('http://localhost:5001/api/auth/reset', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ token, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Ошибка сброса');
    msgEl.textContent = 'Пароль обновлён! Теперь войдите.';
    msgEl.style.color = '#238b00';
    msgEl.style.display = '';
    setTimeout(()=>{
      modal.style.display = 'none';
      modal.setAttribute('hidden', '');
      if (document.getElementById('loginModal')) {
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('loginModal').removeAttribute('hidden');
      }
    }, 1400);
  } catch (err) {
    msgEl.textContent = err.message;
    msgEl.style.color = '#c22';
    msgEl.style.display = '';
  }
  };
};
// === showToast (ensure global) ===
function showToast(message, type = 'info', timeout = 3500) {
  let toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '36px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = type === 'error' ? '#e30000' : (type === 'success' ? '#238b00' : '#222');
  toast.style.color = '#fff';
  toast.style.padding = '10px 22px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '1.1em';
  toast.style.zIndex = 9999;
  toast.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity .23s';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.remove(); }, 300);
  }, timeout);
}
window.showToast = showToast;