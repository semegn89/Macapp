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
document.getElementById('registerForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  clearErrors(form);

  const email = form.rEmail.value;
  const password = form.rPassword.value;

  try {
    const res = await fetch('https://macapp.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка регистрации');

    alert('✅ Регистрация успешна. Теперь войдите.');
    form.reset();

    // Показать форму входа
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerModal').setAttribute('hidden', '');
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginModal').removeAttribute('hidden');
  } catch (err) {
    alert('❌ Ошибка: ' + err.message);
  }
});
    window.handleLoginForm = async (e) => {
  e.preventDefault();
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

    // Сохраняем вход
    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    document.body.classList.add('logged-in');

    alert('🎉 Вход выполнен');
    location.reload(); // Или переключить UI вручную
  } catch (err) {
    alert('❌ Ошибка: ' + err.message);
  }
};
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
