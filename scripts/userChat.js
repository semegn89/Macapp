// Универсальный рендер сообщений (локально для userChat.js)
function renderMessages(arr, container, currentUserRole = 'user') {
  // Проверяем, был ли пользователь внизу до обновления
  const wasAtBottom = (container.scrollTop + container.clientHeight >= container.scrollHeight - 10);
  container.innerHTML = '';
  arr.forEach(msg => {
    const who = msg.from === 'user' ? 'user' : 'admin';
    const name = who === 'user'
      ? (currentUserRole === 'admin' ? (msg.userEmail || "Пользователь") : "Вы")
      : "Менеджер";
    const text = msg.fileName
      ? `<a href="${msg.fileData}" class="file-link" download="${msg.fileName}">${msg.fileName}</a>`
      : msg.text;
    const div = document.createElement('div');
    div.className = `chat-bubble ${who}`;
    div.innerHTML = `
      <div class="text">${text}</div>
      <div class="meta">
        <span class="author">${name}</span> ${msg.date || ''}
      </div>
    `;
    container.appendChild(div);
  });
  // Скроллим вниз только если пользователь был внизу
  if (wasAtBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

window.renderUserChatPage = async function () {
  const details = document.querySelector('.details');
  const curUser = window.currentUser || {};
  if (!curUser || curUser.role !== 'user') {
    details.innerHTML = '<h1>Доступно только для пользователей.</h1>';
    return;
  }

  const userEmail = curUser.email;

  // Главный HTML — стиль Telegram/WhatsApp, полная поддержка всех классов!
  details.innerHTML = `
    <div class="chat-container">
      <div class="chat-messages"></div>
      <form class="chat-input-row">
        <button type="button" class="attach-btn" title="Прикрепить файл">📎</button>
        <input type="file" class="hidden-file" style="display:none;">
        <input type="text" placeholder="Введите сообщение...">
        <button type="submit">Отправить</button>
      </form>
      <div class="selected-file-name" style="font-size:0.96em;color:#555;margin-top:2px;min-height:20px;"></div>
      <div id="userChatUnreadNotice" style="text-align:center;color:#0057ff;display:none;">
        Новое сообщение от менеджера
      </div>
    </div>
  `;

  // Получаем элементы
  const chatMessages = details.querySelector('.chat-messages');
  const chatForm = details.querySelector('.chat-input-row');
  const chatInput = chatForm.querySelector('input[type="text"]');
  const fileInput = chatForm.querySelector('input[type="file"]');
  const attachBtn = chatForm.querySelector('.attach-btn');
  const fileNameDiv = details.querySelector('.selected-file-name');
  const unreadNotice = details.querySelector('#userChatUnreadNotice');

  let chatArr = [];

  // Загрузка истории чата с сервера
  async function loadChat() {
    try {
      const res = await fetch(`/api/userchat/${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        chatArr = await res.json();
        renderMessages(chatArr, chatMessages, 'user');
        updateUnreadNotice();
      } else {
        console.error('Failed to load chat history:', res.statusText);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }

  // Обновить индикатор новых сообщений
  function updateUnreadNotice() {
    const unreadCount = chatArr.filter(msg => msg.from === 'admin' && !msg.readByUser).length;
    if (unreadNotice) {
      unreadNotice.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    const badge = document.getElementById('userChatUnread');
    if (badge) {
      badge.textContent = unreadCount > 0 ? unreadCount : '';
      badge.style.display = unreadCount > 0 ? '' : 'none';
    }
  }

  // Отметить все сообщения от админа как прочитанные (локально, сервер должен обновлять статус)
  function markAdminMessagesReadLocally() {
    let wasUnread = false;
    chatArr.forEach(msg => {
      if (msg.from === 'admin' && !msg.readByUser) {
        msg.readByUser = true;
        wasUnread = true;
      }
    });
    if (wasUnread) {
      if (unreadNotice) unreadNotice.style.display = 'none';
      const badge = document.getElementById('userChatUnread');
      if (badge) badge.style.display = 'none';
    }
  }

  // Показываем имя выбранного файла
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      fileNameDiv.textContent = `Выбрано: ${fileInput.files[0].name}`;
    } else {
      fileNameDiv.textContent = '';
    }
  });
  attachBtn.addEventListener('click', () => fileInput.click());

  // Отправка сообщения
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const txt = chatInput.value.trim();
    const file = fileInput.files[0];
    if (!txt && !file) return;

    let fileName = '';
    let fileData = '';

    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        fileName = file.name;
        fileData = ev.target.result;

        try {
          const res = await fetch(`/api/userchat/${encodeURIComponent(userEmail)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: txt, fileName, fileData })
          });
          if (res.ok) {
            chatInput.value = '';
            fileInput.value = '';
            fileNameDiv.textContent = '';
            await loadChat();
            markAdminMessagesReadLocally();
          } else {
            console.error('Failed to send message:', res.statusText);
          }
        } catch (err) {
          console.error('Error sending message:', err);
        }
      };
      reader.readAsDataURL(file);
    } else {
      try {
        const res = await fetch(`/api/userchat/${encodeURIComponent(userEmail)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: txt, fileName: '', fileData: '' })
        });
        if (res.ok) {
          chatInput.value = '';
          await loadChat();
          markAdminMessagesReadLocally();
        } else {
          console.error('Failed to send message:', res.statusText);
        }
      } catch (err) {
        console.error('Error sending message:', err);
      }
    }
  });

  // Периодическая проверка новых сообщений
  setInterval(async () => {
    await loadChat();
    updateUnreadNotice();
    markAdminMessagesReadLocally();
  }, 3000);

  await loadChat();
  markAdminMessagesReadLocally();
};


// Элементы
const chatBox = document.getElementById('userChatBox');
const chatForm = document.getElementById('userChatForm');
const chatInput = document.getElementById('userChatInput');
const chatFile = document.getElementById('userChatFile');
const attachBtn = document.getElementById('userAttachFileBtn');
const fileNameDiv = document.getElementById('userSelectedFileName');
const unreadNotice = document.getElementById('userChatUnreadNotice');

let chatArr = [];
let userEmail = (window.currentUser && window.currentUser.email) || '';

// Рендер чата
function renderChat() {
  renderMessages(chatArr, chatBox, 'user');
}

// Загрузка истории чата с сервера
async function loadChat() {
  if (!userEmail) return;
  try {
    const res = await fetch(`/api/userchat/${encodeURIComponent(userEmail)}`);
    if (res.ok) {
      chatArr = await res.json();
      renderChat();
      updateUnreadNotice();
    } else {
      console.error('Failed to load chat history:', res.statusText);
    }
  } catch (err) {
    console.error('Error loading chat history:', err);
  }
}

// Обновить индикатор новых сообщений
function updateUnreadNotice() {
  const unreadCount = chatArr.filter(msg => msg.from === 'admin' && !msg.readByUser).length;
  if (unreadNotice) {
    unreadNotice.style.display = unreadCount > 0 ? 'block' : 'none';
  }
  const badge = document.getElementById('userChatUnread');
  if (badge) {
    badge.textContent = unreadCount > 0 ? unreadCount : '';
    badge.style.display = unreadCount > 0 ? '' : 'none';
  }
}

// Показываем имя выбранного файла
chatFile.addEventListener('change', () => {
  if (chatFile.files[0]) {
    fileNameDiv.textContent = `Выбрано: ${chatFile.files[0].name}`;
  } else {
    fileNameDiv.textContent = '';
  }
});
attachBtn.addEventListener('click', () => chatFile.click());

// Отправка сообщения
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const txt = chatInput.value.trim();
  const file = chatFile.files[0];
  if (!txt && !file) return;

  let fileName = '';
  let fileData = '';

  if (file) {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      fileName = file.name;
      fileData = ev.target.result;

      try {
        const res = await fetch(`/api/userchat/${encodeURIComponent(userEmail)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: txt, fileName, fileData })
        });
        if (res.ok) {
          chatFile.value = '';
          fileNameDiv.textContent = '';
          chatInput.value = '';
          await loadChat();
          markAdminMessagesReadLocally();
        } else {
          console.error('Failed to send message:', res.statusText);
        }
      } catch (err) {
        console.error('Error sending message:', err);
      }
    };
    reader.readAsDataURL(file);
  } else {
    fetch(`/api/userchat/${encodeURIComponent(userEmail)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: txt, fileName: '', fileData: '' })
    }).then(res => {
      if (res.ok) {
        chatInput.value = '';
        loadChat();
        markAdminMessagesReadLocally();
      } else {
        console.error('Failed to send message:', res.statusText);
      }
    }).catch(err => {
      console.error('Error sending message:', err);
    });
  }
});

// Отметить все новые сообщения админа как прочитанные (локально)
function markAdminMessagesReadLocally() {
  let wasUnread = false;
  chatArr.forEach(msg => {
    if (msg.from === 'admin' && !msg.readByUser) {
      msg.readByUser = true;
      wasUnread = true;
    }
  });
  if (wasUnread) {
    if (unreadNotice) unreadNotice.style.display = 'none';
    const badge = document.getElementById('userChatUnread');
    if (badge) badge.style.display = 'none';
  }
}

// При открытии чата сразу отмечаем все новые сообщения как прочитанные
markAdminMessagesReadLocally();

// Периодическая проверка новых сообщений
setInterval(() => {
  loadChat();
  updateUnreadNotice();
  markAdminMessagesReadLocally();
}, 3000);

loadChat();

export const renderUserChatPage = window.renderUserChatPage;
// Конец userChat.js