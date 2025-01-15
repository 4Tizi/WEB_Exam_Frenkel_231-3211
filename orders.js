document.addEventListener('DOMContentLoaded', function () {
    initializeOrders();
});

// Объекты для хранения данных товаров
let productNames = {};
let productCosts = {};

// Загрузка данных товаров с ожиданием завершения
function fetchProducts() {
    return fetch('https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=e3435f73-86d3-4d73-9303-8b4487a720e2')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                productNames[String(item.id)] = item.name;
                productCosts[String(item.id)] = item.discount_price ? item.discount_price : item.actual_price;
            })
        })
        .catch(error => {
            console.error('Ошибка при загрузке товаров:', error);
        });
}

fetchProducts();

// Загружаем товары и заказы в правильном порядке
async function initializeOrders() {
    try {
        await fetchProducts(); // Ждем загрузки товаров
        const orders = await fetchOrders(); // Загружаем заказы после загрузки товаров
        displayOrders(orders);
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        showAlert('Не удалось загрузить заказы.');
    }
}

// Запрос на получение данных заказов
function fetchOrders() {
    return fetch("https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders?api_key=e3435f73-86d3-4d73-9303-8b4487a720e2", { method: 'GET' })
        .then(response => response.json());
}

// Отображение заказов в таблице
function displayOrders(orders) {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = ''; // Очищаем таблицу перед добавлением новых строк

    let orderIdCounter = 1;
    const baseDeliveryCost = 200;  // Базовая стоимость доставки

    orders.forEach(order => {
        const row = createOrderRow(order, orderIdCounter++, baseDeliveryCost);
        tbody.appendChild(row);
    });
}

// Создание строки таблицы для каждого заказа
function createOrderRow(order, orderId, baseDeliveryCost) {
    const row = document.createElement('tr');

    let formattedCreationDate = `${(order.created_at).slice(0, 10)} ${(order.created_at).slice(11, -3)}`;
    let formattedDeliveryDate = formatDateToDDMMYYYY(order.delivery_date);

    const productIds = order.good_ids;
    const productList = productIds.map(id => id ? getProductNameById(id) : '').join(', ');
    const totalOrderPrice = calculateTotalPrice(productIds) + calculateDeliveryCost(order.delivery_date, order.delivery_interval, baseDeliveryCost);

    row.dataset.id = order.id;
    row.dataset.full_name = order.full_name;
    row.dataset.created_at = formattedCreationDate;
    row.dataset.delivery_date = formattedDeliveryDate;
    row.dataset.delivery_interval = order.delivery_interval;
    row.dataset.email = order.email;
    row.dataset.phone = order.phone;
    row.dataset.delivery_address = order.delivery_address;
    row.dataset.cost = `${totalOrderPrice} ₽`;
    row.dataset.order = productList;
    row.dataset.comment = order.comment || '';

    row.innerHTML = `
        <td>${orderId}</td>
        <td>${formattedCreationDate}</td>
        <td>${productList}</td>
        <td>${totalOrderPrice} ₽</td>
        <td>${formattedDeliveryDate}<br>${order.delivery_interval}</td>
        <td>
            <span class="action-btn" onclick="viewOrderDetails(this)" title="Подробнее"><img src="eye.svg" alt="Eye"></span>
            <span class="action-btn" onclick="editOrderDetails(this)" title="Редактировать"><img src="pencil.svg" alt="Pencil"></span>
            <span class="action-btn" onclick="removeOrder(this)" title="Удалить"><img src="trash.svg" alt="Trash"></span>
        </td>
    `;
    
    return row;
}

// Форматирование даты в формат dd.mm.yyyy
function formatDateToDDMMYYYY(dateString) {
    const dateParts = dateString.split('-');
    return `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
}

// Получение названия товара по его ID
function getProductNameById(id) {
    return productNames[String(id)];
}

// Расчет общей стоимости товаров в заказе
function calculateTotalPrice(productIds) {
    return productIds
        .filter(id => id) // Исключаем null или undefined
        .reduce((total, id) => total + (productCosts[String(id)] || 0), 0);
}

// Расчет стоимости доставки
function calculateDeliveryCost(date, timeInterval, baseCost) {
    let deliveryCost = baseCost;

    const deliveryDate = new Date(date);
    const dayOfWeek = deliveryDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        deliveryCost += 500;  // Доплата за выходные
    }

    if (timeInterval === "18:00-22:00") {
        deliveryCost += 200;  // Доплата за вечерний интервал
    }

    return deliveryCost;
}

// Функция для закрытия модального окна
function closeModal() {
    document.getElementById('overlay').style.display = 'none';
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none');
}

// Функция для открытия модального окна
function openModal(type) {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById(type + '-modal').style.display = 'block';
}


// Открытие модального окна с деталями заказа
function viewOrderDetails(button) {
    const row = button.closest('tr');

    document.getElementById('view-date').textContent = row.dataset.created_at;
    document.getElementById('view-full-name').textContent = row.dataset.full_name;
    document.getElementById('view-phone').textContent = row.dataset.phone;
    document.getElementById('view-email').textContent = row.dataset.email;
    document.getElementById('view-address').textContent = row.dataset.delivery_address;
    document.getElementById('view-datetime').textContent = row.dataset.delivery_date;
    document.getElementById('view-time').textContent = row.dataset.delivery_interval;
    document.getElementById('view-goods').textContent = row.dataset.order;
    document.getElementById('view-cost').textContent = row.dataset.cost;
    document.getElementById('view-comment').textContent = row.dataset.comment || '';

    openModal('view');
}

// Открытие модального окна для редактирования заказа
function editOrderDetails(button) {
    const row = button.closest('tr');
    openModal('edit');

    document.getElementById('edit-order-id').value = row.dataset.id;
    document.getElementById('edit-date').value = row.dataset.created_at;
    document.getElementById('edit-full-name').value = row.dataset.full_name;
    document.getElementById('edit-phone').value = row.dataset.phone;
    document.getElementById('edit-email').value = row.dataset.email;
    document.getElementById('edit-address').value = row.dataset.delivery_address;

    const deliveryDateParts = row.dataset.delivery_date.split('.');
    const formattedDate = `${deliveryDateParts[2]}-${deliveryDateParts[1]}-${deliveryDateParts[0]}`;
    document.getElementById('edit-datetime').value = formattedDate;
    document.getElementById('edit-time').value = row.dataset.delivery_interval;
    document.getElementById('edit-order').value = row.dataset.order;
    document.getElementById('edit-cost').value = row.dataset.cost;
    document.getElementById('edit-comment').value = row.dataset.comment || '';
}

// Сохранение изменений в заказе
function saveUpdatedOrder() {
    const orderId = document.getElementById('edit-order-id').value;
    if (!orderId) {
        console.error('ID заказа не найден.');
        return;
    }

    const formData = new FormData();
    formData.append('full_name', document.getElementById('edit-full-name').value);
    formData.append('phone', document.getElementById('edit-phone').value);
    formData.append('email', document.getElementById('edit-email').value);
    formData.append('delivery_address', document.getElementById('edit-address').value);
    formData.append('delivery_date', document.getElementById('edit-datetime').value);
    formData.append('delivery_interval', document.getElementById('edit-time').value);
    formData.append('comment', document.getElementById('edit-comment').value);
    formData.append('order', document.getElementById('edit-order').value);
    formData.append('cost', parseFloat(document.getElementById('edit-cost').value));

    fetch(`https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders/${orderId}?api_key=e3435f73-86d3-4d73-9303-8b4487a720e2`, {
        method: 'PUT',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            if (data['error']) {
                showAlert(data['error']);
            } else {
                alert('Заказ успешно обновлен');
                closeModal();
                location.reload();
            }
        })
        .catch(error => {
            console.error('Ошибка при обновлении заказа:', error);
            showAlert('Ошибка при обновлении заказа');
        });
}

function removeOrder(button) {
    const row = button.closest('tr');
    openModal('delete');
    const orderId = row.dataset.id; // Получаем ID заказа
    if (!orderId) {
        console.error('ID заказа не найден.');
        return;
    }
    // Сохраняем ID заказа в переменную
    orderIdToDelete = orderId;
}

// Подтверждение удаления
function confirmDeletion() {
    if (!orderIdToDelete) {
        console.error('ID заказа не найден.');
        return;
    }

    // Отправляем запрос на удаление
    fetch(`https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders/${orderIdToDelete}?api_key=e3435f73-86d3-4d73-9303-8b4487a720e2`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            if (data['error']) {
                showNotification('Ошибка при удалении заказа');
            } else {
                closeModal();
                location.reload();
            }
        })
        .catch(error => console.error('Ошибка:', error));
}

// Функция для отображения уведомлений
function showAlert(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}
