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