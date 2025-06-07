// templates.js
import { showToast, showPreview } from './utils.js';

export async function renderTemplatesPage(){
    const details=document.querySelector('.details');
    const isAdmin=(window.currentUser?.role==='admin');

    details.innerHTML=`
      <h1>Шаблоны документов</h1>

      <p>Ниже — список компаний/организаций (карточки). Нажмите, чтобы просмотреть/скачать их шаблоны.</p>
      ${
        isAdmin ? `<button id="addCompanyBtn" class="button" style="margin-bottom:10px;">Добавить новую «карточку»</button>` : ``
      }
      <div id="companiesContainer"></div>
    `;
    const addCompanyBtn=details.querySelector('#addCompanyBtn');
    const companiesContainer=details.querySelector('#companiesContainer');

    // Серверные функции API
    async function fetchCompanies() {
      try {
        const res = await fetch('/api/templates/companies');
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        showToast('Ошибка','error');
        return [];
      }
    }
    async function addCompanyApi(name) {
      try {
        const res = await fetch('/api/templates/companies', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({name}),
        });
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        showToast('Ошибка','error');
        return null;
      }
    }
    async function deleteCompanyApi(id) {
      try {
        const res = await fetch(`/api/templates/companies/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error();
        return true;
      } catch {
        showToast('Ошибка','error');
        return false;
      }
    }
    async function fetchTemplates(companyId) {
      try {
        const res = await fetch(`/api/templates/${encodeURIComponent(companyId)}`);
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        showToast('Ошибка','error');
        return [];
      }
    }
    async function addTemplateApi(companyId, formData) {
      try {
        const res = await fetch(`/api/templates/${encodeURIComponent(companyId)}`, {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        showToast('Ошибка','error');
        return null;
      }
    }
    async function deleteTemplateApi(companyId, tmplId) {
      try {
        const res = await fetch(`/api/templates/${encodeURIComponent(companyId)}/${encodeURIComponent(tmplId)}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error();
        return true;
      } catch {
        showToast('Ошибка','error');
        return false;
      }
    }
    // функция для отображения шалонов карточек компаний в шаблонах и их изменения для админа
    function showAdminChatDetail(email){
      details.innerHTML=`
        <h1>Чат с ${email}</h1>
        <div id="chatCardsContainer" style="margin-top:20px; display: flex; flex-wrap: wrap; gap: 20px;"></div>
        <button id="backToChatsBtn" class="button button-outline" style="margin-top:10px;">Назад к чатам</button>
        <button id="addChatBtn" class="button" style="margin-top:10px;">Добавить новый чат</button>
        <div id="chatForm" style="display:none; margin-top:20px;">
          <form id="newChatForm">
            <div class="form-row">
              <label>Название чата:</label>
              <input type="text" name="name" required>
            </div>
            <div class="form-row">
              <label>Файл чата:</label>
              <input type="file" name="file" required>
            </div>
            <button type="submit" class="button">Сохранить</button>
            <button type="button" id="cancelChat" class="button button-outline" style="margin-left:10px;">Отмена</button>
          </form>
        </div>
        <div id="chatList" style="margin-top:20px; display: flex; flex-wrap: wrap; gap: 20px;"></div>
      `;
      const chatCardsContainer=details.querySelector('#chatCardsContainer');
      const backToChatsBtn=details.querySelector('#backToChatsBtn');
      const addChatBtn=details.querySelector('#addChatBtn');
      const chatForm=details.querySelector('#chatForm');
      const newChatForm=details.querySelector('#newChatForm');
      const cancelChat=details.querySelector('#cancelChat');
      const chatList=details.querySelector('#chatList');
      const allChats=JSON.parse(localStorage.getItem('allChats'))||{};
      const userEmails=Object.keys(allChats);
      if(!userEmails.length){
        chatCardsContainer.innerHTML='<p>Нет чатов с администратором.</p>';
        return;
      }
    }  

    // Основная логика загрузки компаний
    let companies = [];
    async function updateCompaniesAndRender() {
      companies = await fetchCompanies();
      renderCompanyCards();
    }

    if(isAdmin && addCompanyBtn){
      addCompanyBtn.addEventListener('click', async ()=>{
        const name=prompt('Введите название новой компании (карточки), напр. ООО ЛЮТИК');
        if(!name)return;
        const res = await addCompanyApi(name);
        if(res){
          showToast(`Компания «${name}» добавлена!`,'success');
          await updateCompaniesAndRender();
        }
      });
    }

    // Функция для отображения карточек компаний
    async function renderCompanyCards(searchTerm = '') {
      companiesContainer.innerHTML = '';
      let filtered = companies;
      if (searchTerm) {
        filtered = companies.filter(comp => comp.name.toLowerCase().includes(searchTerm));
      }
      if (!filtered.length) {
        companiesContainer.innerHTML = '<p>Нет компаний с таким запросом.</p>';
        return;
      }
      const grid = document.createElement('div');
      grid.className = 'templates-grid';

      filtered.forEach(comp => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
          <div class="template-card-title">${comp.name}</div>
          <div class="template-card-btns">
            <button class="viewTmplBtn button button-sm" data-id="${comp.id}">Просмотреть шаблоны</button>
            ${
              isAdmin
                ? `<button class="delCompanyBtn button button-sm button-outline" data-id="${comp.id}">Удалить</button>`
                : ''
            }
          </div>
        `;
        card.querySelector('.viewTmplBtn').addEventListener('click', function () {
          showCompanyTemplates(comp.id, comp.name);
        });
        if(isAdmin){
          card.querySelector('.delCompanyBtn')?.addEventListener('click', async function(){
            const cid = this.getAttribute('data-id');
            if(confirm('Удалить эту карточку компании?')){
              const ok = await deleteCompanyApi(cid);
              if(ok){
                showToast('Компания удалена!','info');
                await updateCompaniesAndRender();
              }
            }
          });
        }
        grid.appendChild(card);
      });
      companiesContainer.appendChild(grid);
    }

    // Функция для отображения шаблонов компании 
    async function showCompanyTemplates(companyId, companyName){
      details.innerHTML = `
        <div class="tmpls-inner-header">
          <span class="tmpls-title">Шаблоны для ${companyName}</span>
          ${
            isAdmin
              ? `<button id="tmplAddBtn" class="tmpls-add-btn">+ Добавить шаблон</button>`
              : ''
          }
          <button id="tmplBackBtn" class="button button-outline" style="margin-left:auto;">Назад</button>
        </div>
        <div id="tmplList" class="tmpls-list"></div>
      `;
      const tmplList = details.querySelector('#tmplList');
      const tmplAddBtn = details.querySelector('#tmplAddBtn');
      const tmplBackBtn = details.querySelector('#tmplBackBtn');

      let allTemplates = await fetchTemplates(companyId);

      function getFileIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        if (ext === 'pdf') return `<span class="tmpls-icon">📄</span>`;
        if (['doc','docx'].includes(ext)) return `<span class="tmpls-icon">📝</span>`;
        if (['xls','xlsx'].includes(ext)) return `<span class="tmpls-icon">📊</span>`;
        if (['png','jpg','jpeg'].includes(ext)) return `<span class="tmpls-icon">🖼️</span>`;
        return `<span class="tmpls-icon">📁</span>`;
      }

      async function renderTmplList(){
        allTemplates = await fetchTemplates(companyId);
        tmplList.innerHTML = '';
        if(!allTemplates.length){
          tmplList.innerHTML = '<div class="tmpls-empty">Нет шаблонов для данной компании.</div>';
          return;
        }
        allTemplates.forEach(tmpl => {
          const card = document.createElement('div');
          card.className = 'tmpls-card';
          card.innerHTML = `
            ${getFileIcon(tmpl.fileName)}
            <div class="tmpl-name">${tmpl.name}</div>
            <div class="tmpl-filename">${tmpl.fileName}</div>
            <div class="tmpl-actions">
              <button class="prevTmplBtn button button-sm" data-id="${tmpl.id}">Просмотр</button>
              <a href="/api/templates/${encodeURIComponent(companyId)}/${encodeURIComponent(tmpl.id)}/download" download="${tmpl.fileName}" class="button button-sm">Скачать</a>
              ${isAdmin? `<button class="delTmplBtn button button-sm button-outline" data-id="${tmpl.id}">Удалить</button>` : ''}
            </div>
          `;
          card.querySelector('.prevTmplBtn').onclick = async () => {
            // Для предпросмотра попробуем получить blob с сервера и показать
            try {
              const res = await fetch(`/api/templates/${encodeURIComponent(companyId)}/${encodeURIComponent(tmpl.id)}/download`);
              if (!res.ok) throw new Error();
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              if(tmpl.fileName.toLowerCase().endsWith('.pdf')){
                showPreview(`<iframe src="${url}" width="100%" height="600px"></iframe>`);
              } else if(/\.(png|jpe?g)$/i.test(tmpl.fileName)){
                showPreview(`<img src="${url}" style="max-width:100%;height:auto;" />`);
              } else {
                showPreview(`<p>Невозможно отобразить "${tmpl.fileName}". Попробуйте скачать.</p>`);
              }
            } catch {
              showToast('Ошибка','error');
            }
          };
          card.querySelector('.delTmplBtn')?.addEventListener('click',async ()=>{
            if(confirm('Удалить этот шаблон?')){
              const ok = await deleteTemplateApi(companyId, tmpl.id);
              if(ok){
                showToast('Шаблон удалён!','info');
                await renderTmplList();
              }
            }
          });
          tmplList.appendChild(card);
        });
      }

      // Модалка добавления шаблона
      function showAddModal(){
        const bg = document.createElement('div');
        bg.className = 'tmpls-modal-bg';
        bg.innerHTML = `
          <div class="tmpls-modal">
            <form id="tmplModalForm" autocomplete="off">
              <label>Название шаблона:</label>
              <input type="text" name="name" required maxlength="80" autocomplete="off">
              <label>Файл шаблона:</label>
              <input type="file" name="file" required>
              <div class="btns">
                <button type="submit" class="button">Сохранить</button>
                <button type="button" id="tmplCancelBtn" class="button button-outline">Отмена</button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(bg);
        const modalForm = bg.querySelector('#tmplModalForm');
        const cancelBtn = bg.querySelector('#tmplCancelBtn');
        cancelBtn.onclick = () => document.body.removeChild(bg);

        modalForm.onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(modalForm);
          if(!fd.get('file')){
            showToast('Не выбран файл','error');
            return;
          }
          const res = await addTemplateApi(companyId, fd);
          if(res){
            showToast('Шаблон добавлен!','success');
            document.body.removeChild(bg);
            await renderTmplList();
          }
        };
      }

      if(isAdmin && tmplAddBtn){
        tmplAddBtn.onclick = showAddModal;
      }
      tmplBackBtn.onclick = () => renderTemplatesPage();

      await renderTmplList();
    }

    // Первая загрузка компаний
    await updateCompaniesAndRender();
}