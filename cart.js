document.addEventListener('DOMContentLoaded', async () => {
    const cartItemsContainer = document.querySelector('.cart-items'); // контейнер для товаров в корзине
    const totalPriceContainer = document.querySelector('.form-group.total'); // элемент для отображения итоговой цены
    let cart = JSON.parse(localStorage.getItem('cart')) || []; // получаем корзину из localStorage

    let totalPrice = 0;
    let baseDeliveryPrice = 200;  // Начальная стоимость доставки

// Функция для расчета стоимости доставки
function updateDeliveryCost(date, time) {
    let deliveryCost = baseDeliveryPrice;  // Сброс стоимости доставки при изменении

    // Получаем день недели (0 - воскресенье, 1 - понедельник, ..., 6 - суббота)
    const deliveryDate = new Date(date);
    const dayOfWeek = deliveryDate.getDay();  // Получаем день недели

    // Проверка на выходные дни (суббота и воскресенье)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        deliveryCost += 300; // Если выходной, добавляем 300 руб.
    }

    // Проверка времени доставки
    if (time === "18:00-22:00") {
        deliveryCost += 200; // Если вечерний интервал, добавляем 200 руб.
    }

    // Перерасчитываем итоговую стоимость (товары + доставка)
    const totalAmount = totalPrice + deliveryCost;

    // Обновляем информацию о стоимости доставки и итоговой стоимости в интерфейсе
    totalPriceContainer.innerHTML = `
        <label>Итоговая стоимость товаров: ${totalPrice} ₽</label>
        <span>(стоимость доставки: ${deliveryCost} ₽)</span>
        <h3>Итоговая сумма: ${totalAmount} ₽</h3>
    `;
}


    // Функция для отображения уведомлений
    function showAlert(message) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const notificationButton = document.getElementById('notification-button');

        notificationText.textContent = message;
        notification.classList.remove('hidden'); // Показать уведомление

        // Закрыть уведомление при нажатии на кнопку "Окей"
        notificationButton.addEventListener('click', () => {
            notification.classList.add('hidden');
        });
    }

    // Функция для отображения рейтинга товаров
    function getRatingStars(rating) {
        const fullStar = '★';
        const emptyStar = '☆';
        const totalStars = 5;  // Всего звезд

        let ratingDisplay = '';
        const fullStars = Math.floor(rating); // Полные звезды

        const halfStar = (rating - fullStars) >= 0.5 ? 1 : 0; // Если дробь больше 0.5, добавляем половину звезды

        const emptyStars = totalStars - fullStars - halfStar; // Количество пустых звезд

        ratingDisplay += fullStar.repeat(fullStars);

        // Добавляем половину звезды
        if (halfStar === 1) {
            ratingDisplay += '⯨';
        }

        // Добавляем пустые звезды
        ratingDisplay += emptyStar.repeat(emptyStars);

        return ratingDisplay;
    }

    // Функция для отображения скидки на товар
    function getDiscountPercentage(actualPrice, discountPrice) {
        let discount = 0;
        if (discountPrice) {
            const discountPercent = ((actualPrice - discountPrice) / actualPrice) * 100;
            discount = `-${discountPercent.toFixed(0)}%`;
        } else {
            discount = '';
        }
        return discount;
    }

     // Функция для отображения товаров в корзине
     function renderCartItems() {
        cartItemsContainer.innerHTML = '';  // Очищаем корзину перед рендером
        totalPrice = 0;  // Сбрасываем итоговую цену товаров

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Корзина пуста. Перейдите в каталог, чтобы добавить товары.</p>';
        } else {
            cart.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                itemElement.innerHTML = `
    <div class="cart-item-details">
        <img src="${item.image_url}" alt="${item.name}" class="product-image">
        <div>
            <h3 class="product-name">${item.name}</h3>
            <div class="product-rating">${item.rating} ${getRatingStars(item.rating)}</div>
            <div class="product-price">
                <span class="actual-price ${item.discount_price ? 'discounted' : ''}">
                    ${item.discount_price ? item.discount_price : item.actual_price} ₽
                </span>
                ${item.discount_price ? `<span class="discount-price">${item.actual_price} ₽</span><span class="discount"> ${getDiscountPercentage(item.actual_price, item.discount_price)}</span>` : ''}
            </div>
            <button class="cart-btn" data-index="${index}">Удалить</button>
        </div>
    </div>
`;
                cartItemsContainer.appendChild(itemElement);

                // Суммируем стоимость товаров
                totalPrice += item.discount_price ? item.discount_price : item.actual_price;
            });
        }

        // Перерасчитываем стоимость доставки и итоговую сумму
        const deliveryDateInput = document.querySelector('#date');
        const deliveryTimeInput = document.querySelector('#time');

        // Обработчик изменения даты и времени доставки
        if (deliveryDateInput && deliveryTimeInput) {
            const selectedDate = deliveryDateInput.value;
            const selectedTime = deliveryTimeInput.value;
            updateDeliveryCost(selectedDate, selectedTime);
        }

        // Если еще нет даты и времени, показываем дефолтную стоимость
        if (!deliveryDateInput || !deliveryTimeInput) {
            totalPriceContainer.innerHTML = `
                <label>Итоговая стоимость товаров: ${totalPrice} ₽</label>
                <span>(стоимость доставки: ${baseDeliveryPrice} ₽)</span>
                <h3>Итоговая сумма: ${totalPrice + baseDeliveryPrice} ₽</h3>
            `;
        }
    }

    // Вызов функции для отображения товаров в корзине
    renderCartItems();


        // Обработчик клика по кнопке "Удалить"
        cartItemsContainer.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('cart-btn')) {
                const itemIndex = e.target.getAttribute('data-index'); // Получаем индекс товара из data-атрибута
        
                // Удаляем товар из корзины
                cart.splice(itemIndex, 1);
        
                // Обновляем корзину в localStorage
                localStorage.setItem('cart', JSON.stringify(cart));
        
                // Перерисовываем корзину
                renderCartItems();
            }
        });
    
        // Сброс формы и корзины
        document.querySelector('.reset-btn').addEventListener('click', () => {
            // Очищаем корзину
            cart = [];
            localStorage.removeItem('cart');
            totalPrice = 0;
            console.log(cart);
            console.log(totalPrice);
    
            // Перерисовываем корзину
            renderCartItems();
    
            // Сбрасываем стоимость доставки в интерфейсе
            totalPriceContainer.innerHTML = `
                <label>Итоговая стоимость товаров: 0 ₽</label>
                <span>(стоимость доставки: ${baseDeliveryPrice} ₽)</span>
                <h3>Итоговая сумма: ${baseDeliveryPrice} ₽</h3>
            `;
        });
    
        // Обработчики изменения даты и времени доставки
        const deliveryDateInput = document.querySelector('#date');
        const deliveryTimeInput = document.querySelector('#time');
    
        deliveryDateInput.addEventListener('change', () => {
            const selectedDate = deliveryDateInput.value;
            const selectedTime = deliveryTimeInput.value;
            // Перерасчитываем стоимость доставки
            updateDeliveryCost(selectedDate, selectedTime);
        });
    
        deliveryTimeInput.addEventListener('change', () => {
            const selectedDate = deliveryDateInput.value;
            const selectedTime = deliveryTimeInput.value;
            // Перерасчитываем стоимость доставки
            updateDeliveryCost(selectedDate, selectedTime);
        });

    // Функция для преобразования даты
    function formatDate(dateString) {
        const dateParts = dateString.split('-'); // Разделяем строку по '-'
        const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`; // Строим строку в формате dd.mm.yyyy
        return formattedDate;
    }

    const submitButton = document.querySelector('.submit-btn');

    // Обработчик формы оформления заказа
    submitButton.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Кнопка нажата');

        const name = document.querySelector('#name').value.trim();
        const phone = document.querySelector('#phone').value.trim();
        const email = document.querySelector('#email').value.trim();
        const address = document.querySelector('#address').value.trim();
        const date = document.querySelector('#date').value.trim();
        const time = document.querySelector('#time').value.trim();
        const comment = document.querySelector('#comment').value.trim();
        const subscribe = document.querySelector('#subscribe').checked ? 1 : 0; // Преобразуем в 0 или 1

        const formattedDate = formatDate(date);

        const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
        const validIntervals = ["08:00-12:00", "12:00-14:00", "14:00-18:00", "18:00-22:00"];

        // Проверка на заполнение обязательных полей
        if (!name || !phone || !email || !address || !date || !time) {
            showAlert('Пожалуйста, заполните все обязательные поля.');
            return;
        }

        if (!datePattern.test(formattedDate)) {
            showAlert('Дата должна быть в формате dd.mm.yyyy');
            return;
        }

        if (!validIntervals.includes(time)) {
            showAlert('Недопустимое значение времени доставки.');
            return;
        }

        // Подготовка данных для отправки
        const formData = new FormData();
        formData.append('full_name', name);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('delivery_address', address);
        formData.append('delivery_date', formattedDate);
        formData.append('delivery_interval', time);
        formData.append('comment', comment);
        formData.append('subscribe', subscribe);

        let cart = JSON.parse(localStorage.getItem('cart') || '[]');

        // Добавление товаров в FormData
        if (cart && cart.length > 0) {
            cart.forEach(item => {
                if (item.id) {
                    formData.append('good_ids', parseInt(item.id));
                }
            });
        } else {
            showAlert('Корзина пуста');
            return;
        }

        // Выполнение POST-запроса
        fetch('https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders?api_key=e3435f73-86d3-4d73-9303-8b4487a720e2', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка сети');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    showAlert(data.error);
                } else {
                    alert(`Заказ успешно оформлен! Номер заказа: ${data.id}.`);
                    localStorage.removeItem('cart');
                    window.location.href = '/index.html';
                }
            })
            .catch(error => {
                console.error('Ошибка при отправке:', error);
                showAlert('Произошла ошибка. Попробуйте снова.');
            });
    });

});
