document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const bar = document.getElementById('registerProgressBarInner');
  const text = document.getElementById('registerProgressText');
  if (registerForm && bar && text) {
    function updateProgressBar() {
      const fields = Array.from(registerForm.querySelectorAll('input[required], input[type="checkbox"][required]'));
      const filled = fields.filter(input =>
        (input.type === 'checkbox' ? input.checked : !!input.value.trim())
      ).length;
      const percent = Math.round((filled / fields.length) * 100);
      bar.style.width = percent + "%";
      text.textContent = `Заполнено: ${percent}%`;
    }

    registerForm.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', updateProgressBar);
      input.addEventListener('change', updateProgressBar);
    });

    updateProgressBar();

    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (registerForm.querySelector('button[type="submit"]').disabled) return;
      registerForm.querySelector('button[type="submit"]').disabled = true;

      const formData = new FormData(registerForm);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = typeof value === 'string' ? value.trim() : value;
      });

      // Минимальная валидация email
      if (!data.rEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.rEmail)) {
        alert('Введите корректный email');
        registerForm.querySelector('button[type="submit"]').disabled = false;
        return;
      }
      if (!data.rPassword || !data.rPassword2) {
        alert('Заполните все поля');
        registerForm.querySelector('button[type="submit"]').disabled = false;
        return;
      }
      if (data.rPassword !== data.rPassword2) {
        alert('Пароли не совпадают');
        registerForm.querySelector('button[type="submit"]').disabled = false;
        return;
      }

      const payload = {
        email: data.rEmail,
        password: data.rPassword,
        companyName: data.companyName,
        directorName: data.directorName,
        inn: data.inn,
        address: data.address,
        bankName: data.bankName,
        bik: data.bik,
        accountNumber: data.accountNumber,
        contactPhone: data.contactPhone,
      };

      try {
        const result = await sendAuthRequest('http://localhost:5001/api/auth/register', payload); // PATCH: абсолютный путь для локального API
        alert('Регистрация успешна! Проверьте почту для подтверждения.');
        registerForm.reset();
        updateProgressBar();
      } catch (err) {
        alert(err.message || 'Ошибка регистрации');
      } finally {
        registerForm.querySelector('button[type="submit"]').disabled = false;
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (loginForm.querySelector('button[type="submit"]').disabled) return;
      loginForm.querySelector('button[type="submit"]').disabled = true;

      const formData = new FormData(loginForm);
      const email = formData.get('email') ? formData.get('email').trim() : '';
      const password = formData.get('password') ? formData.get('password').trim() : '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Введите корректный email');
        loginForm.querySelector('button[type="submit"]').disabled = false;
        return;
      }
      if (!password) {
        alert('Введите пароль');
        loginForm.querySelector('button[type="submit"]').disabled = false;
        return;
      }

      try {
        const result = await sendAuthRequest('http://localhost:5001/api/auth/login', { email, password }); // PATCH: абсолютный путь для локального API
        if (result.token) {
          sessionStorage.setItem('token', result.token);
          sessionStorage.setItem('currentUser', JSON.stringify(result.user || {}));
          location.href = '/cabinet.html';
        } else {
          alert('Ошибка входа');
        }
      } catch (err) {
        alert(err.message || 'Ошибка входа');
      } finally {
        loginForm.querySelector('button[type="submit"]').disabled = false;
      }
    });
  }

  async function sendAuthRequest(url, data) {
    if (url.startsWith('/api/')) {
      url = 'http://localhost:5001' + url; // PATCH: абсолютный путь для локального API
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      let message = result.error || 'Ошибка сервера';
      if (message === 'Почта не подтверждена') {
        message = 'Пожалуйста, подтвердите вашу почту!';
      } else if (message === 'Неверный email или пароль') {
        message = 'Неверный email или пароль';
      }
      throw new Error(message);
    }
    return result;
  }
});