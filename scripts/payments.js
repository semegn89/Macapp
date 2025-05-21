/* payments.js */
// Вместо import …
import { showToast } from './utils.js';
import { getItem, setItem } from './dbStorage.js';
// load a TTF font containing Cyrillic glyphs (must be base64‑encoded by your bundler)


// Определяем стили для статуса
function getStatusBackground(status) {
  switch (status) {
    case 'Создан':                return '#f0f0f0';
    case 'Принят':                return '#d0eaff';
    case 'В обработке':           return '#ffe4b5';
    case 'Запрос документов':     return '#e6e6fa';
    case 'Исполнен':              return '#d0f0c0';
    case 'Возвращен отправителю': return '#f4cccc';
    default:                      return '#fff';
  }
}
function getStatusColor(status){
  switch (status) {
    case 'Создан':                return '#333';
    case 'Принят':                return '#0066cc';
    case 'В обработке':           return '#cc6600';
    case 'Запрос документов':     return '#9933cc';
    case 'Исполнен':              return '#009933';
    case 'Возвращен отправителю': return '#cc0000';
    default:                      return '#000';
  }
}

export async function renderPaymentsPage() {
  const details = document.querySelector('.details');

  // Текущий пользователь
  const currentUserData = await getItem('currentUser');
  const curUser = currentUserData ? JSON.parse(currentUserData) : {};
  const isAdmin = (curUser.role === 'admin');

  details.innerHTML = `
  <h1>Платежи</h1>
  <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
    <button id="createPayBtn" class="button">Создать платёж</button>
    <button id="exportCsvBtn" class="button">Экспорт CSV</button>

    <select id="statusFilter" class="button">
      <option value="">Все статусы</option>
      <option value="Создан">Создан</option>
      <option value="Принят">Принят</option>
      <option value="В обработке">В обработке</option>
      <option value="Запрос документов">Запрос документов</option>
      <option value="Исполнен">Исполнен</option>
      <option value="Возвращен отправителю">Возвращен отправителю</option>
    </select>

    <input
      type="text"
      id="searchInput"
      class="button"
      style="width:220px;"
      placeholder="Поиск (получатель / поручение)"
    >

    <select id="sortSelect" class="button">
      <option value="">Без сортировки</option>
      <option value="date_desc">Дата (новее→старее)</option>
      <option value="date_asc">Дата (старее→новее)</option>
      <option value="amount_desc">Сумма (убывание)</option>
      <option value="amount_asc">Сумма (возрастание)</option>
    </select>
  </div>

  <div id="payFormDiv" style="display:none; margin-top:20px;">
    <h3 id="payFormTitle">Новый платёж</h3>
    <form id="payForm" class="payment-form">
      <div class="form-group">
        <label for="purpose">Назначение:</label>
        <input
          id="purpose"
          type="text"
          name="purpose"
          required
          placeholder="Оплата по контракту №..."
        >
      </div>
      <div class="form-group">
        <label for="contractInvoice">Контр/инвойс:</label>
        <input id="contractInvoice" type="text" name="contractInvoice">
      </div>
      <div class="form-group">
        <label for="orderNumber">Номер поручения:</label>
        <input id="orderNumber" type="text" name="orderNumber">
      </div>
      <div class="form-group">
        <label for="swift">SWIFT:</label>
        <input id="swift" type="text" name="swift" required>
      </div>
      <div class="form-group">
        <label for="account">Счёт получателя:</label>
        <input id="account" type="text" name="account" required>
      </div>
      <div class="form-group">
        <label for="receiverName">Получатель:</label>
        <input id="receiverName" type="text" name="receiverName" required>
      </div>
      <div class="form-group">
        <label for="receiverAddress">Адрес получателя:</label>
        <input id="receiverAddress" type="text" name="receiverAddress" required>
      </div>
      <div class="form-group">
        <label for="receiverCountry">Страна получателя:</label>
        <input id="receiverCountry" type="text" name="receiverCountry" required>
      </div>
      <div class="form-group">
        <label for="amount">Сумма:</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          name="amount"
          required
        >
      </div>
      <div class="form-group">
        <label for="currency">Валюта:</label>
        <select id="currency" name="currency">
          <option value="RUB">RUB</option>
          <option value="AED">AED</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="CNY">CNY</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
      <div class="form-group">
        <label for="paymentType">Тип платежа:</label>
        <select id="paymentType" name="paymentType">
          <option value="Товар">Товар</option>
          <option value="Услуга">Услуга</option>
          <option value="Долг">Долг</option>
          <option value="Другое">Другое</option>
        </select>
      </div>
      <div class="form-group">
        <label for="paymentDocs">Документы:</label>
        <input
          id="paymentDocs"
          type="file"
          name="paymentDocs"
          multiple
        >
      </div>

      ${isAdmin ? `
        <div class="form-group">
          <label for="status">Статус:</label>
          <select id="status" name="status">
            <option value="Создан">Создан</option>
            <option value="Принят">Принят</option>
            <option value="В обработке">В обработке</option>
            <option value="Запрос документов">Запрос документов</option>
            <option value="Исполнен">Исполнен</option>
            <option value="Возвращен отправителю">Возвращен отправителю</option>
          </select>
        </div>
        <div class="form-group">
          <label for="purchaseRate">Фактический курс покупки:</label>
          <input
            id="purchaseRate"
            type="number"
            step="0.0001"
            name="purchaseRate"
            placeholder="76.50"
          >
        </div>
        <div class="form-group">
          <label for="dateRubArrive">Дата прихода рублей:</label>
          <input id="dateRubArrive" type="date" name="dateRubArrive">
        </div>
        <div class="form-group">
          <label for="feePercent">Процент вознаграждения:</label>
          <input
            id="feePercent"
            type="number"
            step="0.01"
            name="feePercent"
            placeholder="5"
          >
        </div>
      ` : ''}

      <div class="form-actions">
        <button type="submit" class="button">Сохранить</button>
        <button
          type="button"
          id="cancelEditBtn"
          class="button button-outline"
        >
          Отмена
        </button>
      </div>
    </form>
  </div>

  <div id="paysList" style="margin-top:20px;"></div>
`;
  // Получаем ссылки на элементы
  const createPayBtn   = details.querySelector('#createPayBtn');
  const exportCsvBtn   = details.querySelector('#exportCsvBtn');
  const statusFilterEl = details.querySelector('#statusFilter');
  const searchInputEl  = details.querySelector('#searchInput');
  const sortSelectEl   = details.querySelector('#sortSelect');
  const payFormDiv     = details.querySelector('#payFormDiv');
  const payFormTitle   = details.querySelector('#payFormTitle');
  const payForm        = details.querySelector('#payForm');
  const cancelEditBtn  = details.querySelector('#cancelEditBtn');
  const paysList       = details.querySelector('#paysList');

  let editingIndex = null;

  // Кнопка "Создать платёж"
  createPayBtn.addEventListener('click', () => {
    editingIndex = null;
    payForm.reset();
    payFormTitle.textContent = 'Новый платёж';
    cancelEditBtn.style.display = 'none';
    payFormDiv.style.display = 'block';
  });
  cancelEditBtn.addEventListener('click', () => {
    payForm.reset();
    payFormDiv.style.display = 'none';
    editingIndex = null;
  });

  // Изменение фильтров
  statusFilterEl.addEventListener('change', renderPaymentsList);
  searchInputEl.addEventListener('input', renderPaymentsList);
  sortSelectEl.addEventListener('change', renderPaymentsList);

  // Сабмит формы (создание/редактирование)
  payForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(payForm);

    // Грузим payments
    const paymentsData = await getItem('payments');
    let payments = paymentsData ? JSON.parse(paymentsData) : [];

    // Документы
    const docsData = await getItem('documents');
    let docs = docsData ? JSON.parse(docsData) : [];

    // Текущий user
    const curUserData = await getItem('currentUser');
    const curUser     = curUserData ? JSON.parse(curUserData) : {};
    const isAdminUser = (curUser.role==='admin');

    // feePercent
    let feePercent = 0;
    if (!isAdminUser) {
      // Берём из userObj
      const usersData = await getItem('users');
      const usersArr = usersData ? JSON.parse(usersData) : [];
      const foundUser = usersArr.find(u => u.email===curUser.email);
      feePercent = foundUser ? (foundUser.feePercent||0) : 0;
    } else {
      feePercent = parseFloat(fd.get('feePercent')) || 0;
    }

    // Создаём объект платежа
    const payObj = {
      id: generatePaymentId(),
      purpose:         fd.get('purpose')         || '',
      contractInvoice: fd.get('contractInvoice') || '',
      orderNumber:     fd.get('orderNumber')     || '',
      swift:           fd.get('swift')           || '',
      account:         fd.get('account')         || '',
      receiverName:    fd.get('receiverName')    || '',
      receiverAddress: fd.get('receiverAddress') || '',
      receiverCountry: fd.get('receiverCountry') || '',
      amount:          parseFloat(fd.get('amount')) || 0,
      currency:        fd.get('currency') || 'RUB',
      paymentType:     fd.get('paymentType') || 'Другое',

      date: new Date().toISOString(),
      status: 'Создан',
      docs: [],
      feePercent,
      ownerEmail: curUser.email,

      purchaseRate: 0,
      dateRubArrive: ''
    };
    if (isAdminUser) {
      payObj.status       = fd.get('status')       || 'Создан';
      payObj.purchaseRate = parseFloat(fd.get('purchaseRate')) || 0;
      payObj.dateRubArrive= fd.get('dateRubArrive')|| '';
    }

    // Прикрепление файлов
    const fileList = fd.getAll('paymentDocs');
    async function handleFile(i){
      if(i>=fileList.length) {
        finalize();
        return;
      }
      const file = fileList[i];
      if(!(file instanceof File)){
        await handleFile(i+1);
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev)=>{
        const dataURL = ev.target.result;
        const docId   = Date.now() + '-'+ i;
        const docName = `${payObj.id} от ${payObj.date} — ${file.name}`;
        docs.push({
          id: docId,
          name: docName,
          data: dataURL,
          linkedPaymentId: payObj.id
        });
        payObj.docs.push(docId);
        await setItem('documents', JSON.stringify(docs));
        await handleFile(i+1);
      };
      reader.readAsDataURL(file);
    }
    await handleFile(0);

    async function finalize(){
      if(editingIndex===null){
        payments.push(payObj);
        showToast(`Платёж ${payObj.id} создан`,'success');
      } else {
        payments[editingIndex] = { ...payments[editingIndex], ...payObj };
        showToast(`Платёж ${payObj.id} обновлён`,'success');
      }
      await setItem('payments', JSON.stringify(payments));
      payForm.reset();
      payFormDiv.style.display='none';
      editingIndex = null;
      await renderPaymentsList();
    }
  });

  // Экспорт CSV
  exportCsvBtn.addEventListener('click', async ()=>{
    const paymentsData = await getItem('payments');
    let paysArr = paymentsData ? JSON.parse(paymentsData) : [];
    if(!paysArr.length){
      showToast('Нет данных для экспорта!','info');
      return;
    }
    let csv = "data:text/csv;charset=utf-8," +
      "ID,Purpose,Contract,OrderNo,SWIFT,Account,Receiver,Amount,Currency,Status,feePercent,Date,paymentType,purchaseRate,dateRubArrive\n";
    paysArr.forEach(p=>{
      csv += [
        p.id,
        p.purpose,
        p.contractInvoice,
        p.orderNumber,
        p.swift,
        p.account,
        p.receiverName,
        p.amount,
        p.currency,
        p.status,
        p.feePercent,
        p.date,
        p.paymentType||'',
        p.purchaseRate||0,
        p.dateRubArrive||''
      ].join(',') + "\n";
    });
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download','payments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  async function renderPaymentsList(){
    const paymentsData = await getItem('payments');
    let paysArr = paymentsData ? JSON.parse(paymentsData):[];

    // Пользователь видит только свои платежи
    if(curUser.role!=='admin'){
      paysArr = paysArr.filter(x=> x.ownerEmail===curUser.email);
    }
    // Фильтр по статусу
    const stVal = statusFilterEl.value;
    if(stVal){
      paysArr = paysArr.filter(x=> x.status===stVal);
    }
    // Поиск
    const sVal = (searchInputEl.value||'').toLowerCase();
    if(sVal){
      paysArr = paysArr.filter(p=>{
        const rName = (p.receiverName||'').toLowerCase();
        const oNum  = (p.orderNumber||'').toLowerCase();
        return (rName.includes(sVal) || oNum.includes(sVal));
      });
    }
    // Сортировка
    const srt = sortSelectEl.value;
    if(srt==='date_desc'){
      paysArr.sort((a,b)=> new Date(b.date)-new Date(a.date));
    } else if(srt==='date_asc'){
      paysArr.sort((a,b)=> new Date(a.date)-new Date(b.date));
    } else if(srt==='amount_desc'){
      paysArr.sort((a,b)=> b.amount-a.amount);
    } else if(srt==='amount_asc'){
      paysArr.sort((a,b)=> a.amount-b.amount);
    } else {
      paysArr.sort((a,b)=> new Date(b.date)-new Date(a.date));
    }
    if(!paysArr.length){
      paysList.innerHTML='<p>Нет платежей.</p>';
      return;
    }

    let html='';
    paysArr.forEach((p,index)=>{
      const bg = getStatusBackground(p.status);
      const dateStr = new Date(p.date).toLocaleString();
      html +=`
        <div class="payment-bubble" style="background:${bg}; margin-bottom:15px; padding:10px;">
          <strong>${p.id}</strong> | <em>${dateStr}</em><br>
          Назначение: ${p.purpose} (${p.amount} ${p.currency})<br>
          Контракт/Инвойс: ${p.contractInvoice}<br>
          Номер поручения: ${p.orderNumber||'—'}<br>
          Получатель: ${p.receiverName}, ${p.receiverAddress}, ${p.receiverCountry}<br>
          SWIFT: ${p.swift}, Счёт: ${p.account}<br>
          Процент вознаграждения: ${p.feePercent}%<br>
          Тип платежа: ${p.paymentType||'Другое'}<br>
          <span style="color:${getStatusColor(p.status)};">Статус: ${p.status}</span><br>
          ${
            isAdmin
              ? `Курс покупки: ${p.purchaseRate||0}, Дата прихода: ${p.dateRubArrive||''}<br>`
              : ''
          }
          <div style="margin-top:5px;">
            <button class="payEditBtn button button-sm" data-idx="${index}">Редактировать</button>
            <button class="payDelBtn button button-sm button-outline" data-idx="${index}">Удалить</button>
            <button class="payDocBtn button button-sm button-outline" data-idx="${index}">
              Поручение/Отчёт
            </button>
          </div>
        </div>
      `;
    });
    paysList.innerHTML=html;
    // добавляем пояснения ко всем полям в форме полупрозрачным текстом
    const placeholders = {
      purpose: "Оплата по контракту №...",
      contractInvoice: "Контракт/Инвойс №12345",
      orderNumber: "Номер поручения 67890",
      swift: "SWIFT-код банка, например, ABCDUS33",
      account: "Номер счёта, например, 123456789012",
      receiverName: "Имя получателя, например, John Doe",
      receiverAddress: "Адрес получателя, например, 123 Main St, City",
      receiverCountry: "Страна получателя, например, USA",
      amount: "Сумма платежа, например, 1000.00",
      currency: "Выберите валюту",
      paymentType: "Выберите тип платежа",
      status: "Выберите статус",
      purchaseRate: "Фактический курс, например, 76.50",
      dateRubArrive: "Дата прихода рублей, например, 2023-01-01",
      feePercent: "Процент вознаграждения, например, 5"
    };

    Object.keys(placeholders).forEach(fieldName => {
      const field = payForm.elements[fieldName];
      if (field) {
      const placeholder = placeholders[fieldName];
      field.setAttribute('placeholder', placeholder);
      field.addEventListener('focus', () => {
        field.setAttribute('placeholder', '');
      });
      field.addEventListener('blur', () => {
        field.setAttribute('placeholder', placeholder);
      });
      }
    });

    // добавляем пояснения к полям формы
    const formFields = payForm.querySelectorAll('input, select');
    formFields.forEach(field => {
      const placeholder = field.getAttribute('placeholder');
      if (placeholder) {
        field.addEventListener('focus', () => {
          field.setAttribute('placeholder', '');
        });
        field.addEventListener('blur', () => {
          field.setAttribute('placeholder', placeholder);
        });
        field.setAttribute('placeholder', placeholder);
      }
    }); 
    // Убираем пояснения при фокусе    
    // Удаление
    paysList.querySelectorAll('.payDelBtn').forEach(btn=>{
      btn.addEventListener('click', async function(){
        const paymentsDataDel = await getItem('payments');
        let arr2 = paymentsDataDel ? JSON.parse(paymentsDataDel) : [];
        arr2.sort((a,b)=> new Date(b.date)-new Date(a.date));
        const i= +this.getAttribute('data-idx');
        arr2.splice(i,1);
        await setItem('payments', JSON.stringify(arr2));
        showToast('Платёж удалён','info');
        await renderPaymentsList();
      });
    });
    // Редактирование
    paysList.querySelectorAll('.payEditBtn').forEach(btn=>{
      btn.addEventListener('click', async function(){
        const paymentsDataEdit = await getItem('payments');
        let arr2 = paymentsDataEdit ? JSON.parse(paymentsDataEdit) : [];
        arr2.sort((a,b)=> new Date(b.date)-new Date(a.date));
        editingIndex= +this.getAttribute('data-idx');
        const payObj = arr2[editingIndex];

        payForm.reset();
        payFormTitle.textContent=`Редактировать ${payObj.id}`;
        cancelEditBtn.style.display='inline-block';
        payFormDiv.style.display='block';

        payForm.elements['purpose'].value         = payObj.purpose;
        payForm.elements['contractInvoice'].value = payObj.contractInvoice;
        payForm.elements['orderNumber'].value     = payObj.orderNumber;
        payForm.elements['swift'].value           = payObj.swift;
        payForm.elements['account'].value         = payObj.account;
        payForm.elements['receiverName'].value    = payObj.receiverName;
        payForm.elements['receiverAddress'].value = payObj.receiverAddress;
        payForm.elements['receiverCountry'].value = payObj.receiverCountry;
        payForm.elements['amount'].value          = payObj.amount;
        payForm.elements['currency'].value        = payObj.currency;
        payForm.elements['paymentType'].value     = payObj.paymentType||'Другое';

        if(isAdmin){
          payForm.elements['status'].value        = payObj.status;
          payForm.elements['purchaseRate'].value  = payObj.purchaseRate||0;
          payForm.elements['dateRubArrive'].value = payObj.dateRubArrive||'';
          if(payForm.elements['feePercent']){
            payForm.elements['feePercent'].value  = payObj.feePercent||0;
          }
        }
      });
    });
    // Поручение/Отчёт
    paysList.querySelectorAll('.payDocBtn').forEach(btn=>{
      btn.addEventListener('click', async function(){
        const paymentsDataDoc = await getItem('payments');
        let arr2 = paymentsDataDoc ? JSON.parse(paymentsDataDoc) : [];
        arr2.sort((a,b)=> new Date(b.date)-new Date(a.date));
        const i= +this.getAttribute('data-idx');
        const payObj = arr2[i];
        

        if(payObj.status==='Исполнен'){
          showPdfAgentReport(payObj);
        } else if(payObj.status==='Возвращен отправителю'){
          showPdfReturnRequest(payObj);
        } else {
          showPdfOrderFull(payObj);
        }
      });
    });
  }

  await renderPaymentsList();

  // Генерация УНП-номера
  function generatePaymentId(){
    const num = Math.floor(Math.random()*1000000);
    return `УНП-${String(num).padStart(6,'0')}`;
  }

  // === showPdfAgentReport ===
async function showPdfAgentReport(payObj){
  const doc = new jsPDF();
  // register and switch to Cyrillic font
  // doc.addFileToVFS('NotoSans-Regular.ttf', NotoSans);
  // doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  // doc.setFont('NotoSans', 'normal');

  // базовая настройка документа
  doc.setFontSize(12);
  doc.setLineHeightFactor(1.2);
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);
  doc.rect(10, 10, 190, 277, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Отчёт агента', 10, 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`Платёж: ${payObj.id}`, 10, 30);
  doc.text(`Получатель: ${payObj.receiverName}`, 10, 40);
  doc.text(`Сумма: ${payObj.amount} ${payObj.currency}`, 10, 50);
  doc.text(`Дата: ${new Date(payObj.date).toLocaleDateString()}`, 10, 60);
  doc.text(`Статус: ${payObj.status}`, 10, 70);
  doc.text(`Комиссия: ${payObj.feePercent}%`, 10, 80);
  doc.text(`Курс: ${payObj.purchaseRate}`, 10, 90);
  doc.text(`Дата прихода: ${payObj.dateRubArrive}`, 10, 100);

  // документы
  const docsData = await getItem('documents');
  const docs = docsData ? JSON.parse(docsData) : [];
  doc.text(`Документы:`, 10, 110);
  if(payObj.docs && payObj.docs.length){
    payObj.docs.forEach((docId, idx) => {
      const docData = docs.find(d => d.id === docId);
      doc.text(`- ${docData ? docData.name : docId}`, 10, 120 + idx*10);
    });
  } else {
    doc.text(`- Нет документов`, 10, 120);
  }

  // подписи
  doc.setFont('helvetica', 'bold');
  doc.text(`Подпись агента: ____________________`, 10, 200);
  doc.text(`Подпись принципала: ____________________`, 10, 220);
  doc.setFont('helvetica', 'normal');
  doc.text(`ОCCОО «FRS GROUP»`, 10, 240);
  doc.text(`Директор: ____________________`, 10, 250);

  // сохраняем
  doc.save(`Отчет_${payObj.id}.pdf`);
}

  // === showPdfReturnRequest ===
function showPdfReturnRequest(payObj){
  const doc = new jsPDF();
  // register and switch to Cyrillic font
  // doc.addFileToVFS('NotoSans-Regular.ttf', NotoSans);
  // doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  // doc.setFont('NotoSans', 'normal');

  doc.setFontSize(12);
  doc.text(`Заявление на возврат: ${payObj.orderNumber} (${payObj.id})`, 10, 20);
  doc.text(`...`, 10, 50);

  doc.save(`Возвращен_${payObj.id}.pdf`);
}

  /**
   * ПОЛНОЕ ПОРУЧЕНИЕ (PDF)
   * Берём данные:
   *   1) payObj (сам платёж)
   *   2) userObj (карточка пользователя) — по payObj.ownerEmail
   */
  /**
 * Функция для генерации полного поручения (PDF) по платежу.
 * Данные для Принципала берутся из карточки пользователя (userObj) по payObj.ownerEmail.
 * Если поля не заполнены, используются дефолтные значения.
 * Данные для Агенту (ОccОО «FRS GROUP», директор) заданы статически.
 */
  // === showPdfOrderFull ===
async function showPdfOrderFull(payObj) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  // register and switch to Cyrillic font
  // doc.addFileToVFS('NotoSans-Regular.ttf', NotoSans);
  // doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  // doc.setFont('NotoSans', 'normal');

  // заголовки
  const usersData = await getItem('users');
  const users = usersData ? JSON.parse(usersData) : [];
  const userObj = users.find(u => u.email === payObj.ownerEmail) || {};
  const companyName = userObj.companyName || "ООО «Пример»";
  const inn         = userObj.inn || "0000000000";
  const address     = userObj.address || "г. Пример, ул. Примерная, 1";
  const bankName    = userObj.bankName || "ПАО Банк";
  const bik         = userObj.bik || "123456789";
  const accPrincipal= userObj.accountNumber || "40802810XXXXXX";
  const directorName= userObj.directorName || "Директор не указан";
  const agreementNo = userObj.agreementNo || "12";
  const agreementDate = userObj.agreementDate || "12";

  let payDate = new Date(payObj.date);
  if (isNaN(payDate)) payDate = new Date();
  const formattedPayDate = payDate.toLocaleDateString('ru-RU');

  // строим основной текст
  doc.setFontSize(11);
  doc.text(`Поручение № ${payObj.orderNumber||'—'} от ${formattedPayDate}`, 40, 40);
  doc.text(`к ДОГОВОРУ № ${agreementNo} от ${agreementDate}`, 40, 60);
  let yPos = 90;
  const mainText = `«${companyName}», именуемое «Принципал», в лице Генерального директора ${directorName}, на основании Устава, поручает ОсОО «FRS GROUP» …`
  doc.text(mainText, 40, yPos, { maxWidth: 520 });
  yPos += 100;

  // таблица через autotable
  const tableHead = [[
    "п/н",
    "Контракт/Инвойс",
    "Сумма",
    "Валюта",
    "Получатель и реквизиты",
    "Вознагражд. (%)",
    "Общая сумма (руб.)"
  ]];
  const contractInfo = `${payObj.contractInvoice||'—'} (${formattedPayDate})`;
  const sumOriginal  = payObj.amount.toFixed(2);
  const paymentDetails =
    `Получатель: ${payObj.receiverName}\nАдрес: ${payObj.receiverAddress}\nSWIFT: ${payObj.swift}\nСчёт: ${payObj.account}`;
  const adminRatesData = await getItem('adminRates2');
  const defaultRates = { RUB:{cb:1,agent:1}, USD:{cb:76,agent:88}, EUR:{cb:80,agent:94}, AED:{cb:22,agent:22}, CNY:{cb:12,agent:14}, GBP:{cb:115,agent:122} };
  const adminRates = adminRatesData ? JSON.parse(adminRatesData) : defaultRates;
  const cur = payObj.currency || 'RUB';
  const rateObj = adminRates[cur] || defaultRates[cur];
  const cbRate = rateObj.cb, agentRate = rateObj.agent;
  const overallComm = parseFloat(payObj.feePercent) + ((agentRate - cbRate)/cbRate)*100;
  const totalRub = payObj.amount*cbRate*(1 + overallComm/100);

  const tableBody = [[
    "1",
    contractInfo,
    sumOriginal,
    cur,
    paymentDetails,
    `${overallComm.toFixed(2)}%`,
    `${totalRub.toFixed(2)}`
  ]];
  doc.autoTable({
    startY: yPos,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: { cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: [220,220,220], halign: 'center' },
    margin: { left:40, right:40 },
    columnStyles: {
      0:{cellWidth:30}, 1:{cellWidth:90}, 2:{cellWidth:50},
      3:{cellWidth:40}, 4:{cellWidth:130}, 5:{cellWidth:70}, 6:{cellWidth:70}
    }
  });

  // доп. строки
  let finalY = doc.autoTable.previous.finalY || yPos+100;
  doc.text(`Курс ЦБ РФ на ${formattedPayDate}: ${cbRate.toFixed(4)}`, 40, finalY+30);
  doc.text(`Назначение платежа: ${payObj.purpose}`, 40, finalY+50);
  doc.text("«Принципал»: " + companyName + ", Ген. директор: " + directorName, 40, finalY+100);
  doc.text("«Агент»: ОсОО «FRS GROUP», Директор: Semerenco Grigori", 300, finalY+100);

  doc.save(`Поручение_${payObj.id}.pdf`);
}
}