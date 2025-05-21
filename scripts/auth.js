// auth.js
import { showToast } from './utils.js';
import { getItem, setItem } from './dbStorage.js';

export async function checkAuthStatus() {
  return (await getItem('isLoggedIn')) === 'true';
}

export async function handleLoginForm(e) {
  e.preventDefault();

  const login = document.getElementById('modalEmail')?.value?.trim();
  const password = document.getElementById('modalPassword')?.value?.trim();

  if (!login || !password) {
    showToast('Введите логин и пароль!', 'error');
    return;
  }

  if (login === 'admin@mail.ru' && password === '123456') {
    const adminUser = {
      email: login,
      role: 'admin',
      feePercent: 0,
      currentBalance: 0,
      directorName: '',
      agreementNo: '',
      agreementDate: ''
    };

    await setItem('isLoggedIn', 'true');
    await setItem('currentUser', JSON.stringify(adminUser));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(adminUser));

    closeModalById('loginModal');
    showToast('Вход как Админ!', 'success');
    window.dispatchEvent(new CustomEvent('authChanged'));
    return;
  }

  const usersRaw = await getItem('users');
  const users = usersRaw ? JSON.parse(usersRaw) : [];
  const user = users.find(u => u.email === login && u.password === password);

  if (user) {
    if (!user.role) user.role = 'user';
    // Сохраняем currentUser в IndexedDB и localStorage до закрытия модального окна
    await setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('currentUser', JSON.stringify(user));
    await setItem('isLoggedIn', 'true');
    localStorage.setItem('isLoggedIn', 'true');

    closeModalById('loginModal');
    showToast('Добро пожаловать!', 'success');
    window.dispatchEvent(new CustomEvent('authChanged'));
    return;
  }

  showToast('Неправильный логин или пароль!', 'error');
}

export async function handleRegisterForm(e) {
  e.preventDefault();

  const fd = new FormData(e.target);
  const rEmail = fd.get('rEmail')?.trim();
  const rPassword = fd.get('rPassword')?.trim();
  const rPassword2 = fd.get('rPassword2')?.trim();

  const usersRaw = await getItem('users');
  const users = usersRaw ? JSON.parse(usersRaw) : [];

  if (!rEmail || !rPassword || !rPassword2) {
    showToast('Заполните все поля!', 'error');
    return;
  }
  if (users.some(u => u.email === rEmail)) {
    showToast('Пользователь с таким email уже существует', 'error');
    return;
  }
  if (rPassword !== rPassword2) {
    showToast('Пароли не совпадают', 'error');
    return;
  }

  const newUser = {
    email: rEmail,
    password: rPassword,
    role: 'user'
  };

  users.push(newUser);
  await setItem('users', JSON.stringify(users));
  await setItem('isLoggedIn', 'true');
  await setItem('currentUser', JSON.stringify(newUser));
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(newUser));

  closeModalById('registerModal');
  e.target.reset();
  showToast('Регистрация успешна!', 'success');
  window.dispatchEvent(new CustomEvent('authChanged'));
}

export async function handleLogout() {
  await setItem('isLoggedIn', 'false');
  await setItem('currentUser', '');
  localStorage.setItem('isLoggedIn', 'false');
  localStorage.removeItem('currentUser');

  showToast('Вы вышли из системы', 'success');
  window.dispatchEvent(new CustomEvent('authChanged'));
}

export function closeModalById(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
    modal.setAttribute('hidden', '');
    document.body.classList.remove('no-scroll');
  }
}