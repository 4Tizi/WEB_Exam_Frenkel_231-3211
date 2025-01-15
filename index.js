document.addEventListener('DOMContentLoaded', () => {

    const apiUrl = "https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=e3435f73-86d3-4d73-9303-8b4487a720e2";
    let products = [];

    // Основной запрос для получения данных о товарах
    async function fetchProductData() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Ошибка при получении товаров');
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                products = data;
                renderProductCatalog(products); // Отображаем товары в каталоге
                handleFilters(products); // Обрабатываем фильтры
            } else {
                console.error('Ошибка формата данных');
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        }
    }

    fetchProductData();

    // Функция для создания карточки товара
    function generateProductCard(item) {
        const card = document.createElement('div');
        card.classList.add('product-card');

        // Функция для отображения рейтинга
        function calculateRating(rating) {
            const fullStar = '★';
            const emptyStar = '☆';
            const totalStars = 5;

            let ratingStars = '';
            const fullStarsCount = Math.floor(rating); // целые звезды

            const halfStar = (rating - fullStarsCount) >= 0.5 ? 1 : 0; // добавление половинной звезды

            const emptyStarsCount = totalStars - fullStarsCount - halfStar; // пустые звезды

            ratingStars += fullStar.repeat(fullStarsCount);

            if (halfStar === 1) {
                ratingStars += '⯨';
            }
            ratingStars += emptyStar.repeat(emptyStarsCount);

            return ratingStars;
        }

        // Функция для отображения скидки
        function showDiscount(originalPrice, discountPrice) {
            if (discountPrice) {
                const discountPercentage = ((originalPrice - discountPrice) / originalPrice) * 100;
                return `-${discountPercentage.toFixed(0)}%`;
            }
            return '';
        }

        // Генерация HTML-контента для карточки товара
        card.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}" class="product-image">
            <div class="product-card-details">
                <h3 class="product-name">${item.name}</h3>
                <div class="product-rating">${item.rating} ${calculateRating(item.rating)}</div>
                <div class="product-price">
                    <span class="actual-price ${item.discount_price ? 'discounted' : ''}">
                        ${item.discount_price ? item.discount_price : item.actual_price} ₽
                    </span>
                    ${item.discount_price ? `<span class="discount-price">${item.actual_price} ₽</span><span class="discount">${showDiscount(item.actual_price, item.discount_price)}</span>` : ''}
                </div>
                <button class="add-to-cart">Добавить</button>
            </div>
        `;
        // Добавление обработчика кнопки "Добавить в корзину"
        const addButton = card.querySelector('.add-to-cart');
        addButton.addEventListener('click', () => {
            addItemToCart(item);
        });

        return card;
    }

    const searchInput = document.getElementById('searchInput'); 
    const searchButton = document.getElementById('searchButton');
    const autocompleteList = document.getElementById('autocompleteList');

    async function fetchSearchSuggestions(query) {
        const apiUrl2 = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/autocomplete?query=${encodeURIComponent(query)}&api_key=e3435f73-86d3-4d73-9303-8b4487a720e2`;
        try {
            const response = await fetch(apiUrl2);
            if (!response.ok) {
                throw new Error('Ошибка при получении предложений');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки предложений:', error);
            return [];
        }
    }
    
    // Обновлённая функция отображения предложений
    async function showSuggestions() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            autocompleteList.innerHTML = '';
            autocompleteList.classList.add('autocomplete-list');
            return;
        }
    
        const suggestions = await fetchSearchSuggestions(query);
    
        autocompleteList.innerHTML = '';
        if (suggestions.length === 0) {
            autocompleteList.classList.add('autocomplete-list');
            return;
        }
    
        suggestions.forEach(suggestion => {
            const listItem = document.createElement('li');
            listItem.textContent = suggestion;
            listItem.addEventListener('click', () => {
                const queryParts = searchInput.value.trim().split(' ');
                queryParts.pop(); // Удаляем последнее слово
                queryParts.push(suggestion); // Добавляем выбранное предложение
                searchInput.value = queryParts.join(' ');
                autocompleteList.classList.add('autocomplete-list');
            });
            autocompleteList.appendChild(listItem);
        });
        autocompleteList.classList.remove('hidden');
    }
    
    // Добавление обработчиков событий
    searchInput.addEventListener('input', showSuggestions);
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search')) {
            autocompleteList.classList.add('autocomplete-list');
        }
    });
    
    // Поиск товаров
    searchButton.addEventListener('click', (event) => {
        event.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        const filtered = searchProducts(products, query);
        if (filtered.length === 0) {
            document.querySelector('.product-grid').innerHTML = `<p>Нет товаров, соответствующих вашему запросу</p>`;
        } else {
            renderProductCatalog(filtered);
        }
    });
    

    // Фильтрация товаров по поисковому запросу
    function searchProducts(products, query) {
        return products.filter(product =>
            product.name.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query))
        );
    }

    // Показ уведомлений
    function showNotification(message) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const notificationButton = document.getElementById('notification-button');

        notificationText.textContent = message;
        notification.classList.remove('hidden');

        notificationButton.addEventListener('click', () => {
            notification.classList.add('hidden');
        });
    }

    // Функция для добавления товара в корзину
    function addItemToCart(item) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push(item);
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification('Товар добавлен в корзину');
    }

    // Отображение каталога товаров
    function renderProductCatalog(products) {
        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = '';
        products.forEach(product => {
            const productCard = generateProductCard(product);
            productGrid.appendChild(productCard);
        });
    }

    // Применение фильтров и сортировки
    function handleFilters(allProducts) {
        const sortSelect = document.querySelector('#sort');
        const filterForm = document.querySelector('.filter-form');

        sortSelect.addEventListener('change', () => {
            updateFilteredProducts(allProducts);
        });

        filterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            updateFilteredProducts(allProducts);
        });
    }

    // Обновление списка товаров после применения фильтров
    function updateFilteredProducts(allProducts) {
        const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(checkbox => checkbox.value);
        const minPrice = parseFloat(document.querySelector('input[name="price_from"]').value) || 0;
        const maxPrice = parseFloat(document.querySelector('input[name="price_to"]').value) || Infinity;
        const discountOnly = document.querySelector('input[name="discount"]').checked;
        const sortBy = document.querySelector('#sort').value;

        let filteredProducts = filterByCategory(allProducts, selectedCategories);
        filteredProducts = filterByPrice(filteredProducts, minPrice, maxPrice);

        if (discountOnly) {
            filteredProducts = filterByDiscount(filteredProducts);
        }

        filteredProducts = sortByCriteria(filteredProducts, sortBy);
        renderProductCatalog(filteredProducts);
    }

    // Фильтрация по категориям
    function filterByCategory(products, selectedCategories) {
        if (selectedCategories.length === 0) return products;
        return products.filter(product => {
            return selectedCategories.some(category => product.main_category.includes(category));
        });
    }

    // Фильтрация по цене
    function filterByPrice(products, minPrice, maxPrice) {
        return products.filter(product => {
            const price = product.discount_price || product.actual_price;
            return price >= minPrice && price <= maxPrice;
        });
    }

    // Фильтрация по скидкам
    function filterByDiscount(products) {
        return products.filter(product => product.discount_price !== null);
    }

    // Сортировка товаров по заданным критериям
    function sortByCriteria(products, sortBy) {
        if (sortBy === 'popularity-desc') {
            return products.sort((a, b) => a.rating - b.rating);
        } else if (sortBy === 'popularity-asc') {
            return products.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'price-asc') {
            return products.sort((a, b) => (b.discount_price || b.actual_price) - (a.discount_price || a.actual_price));
        } else if (sortBy === 'price-desc') {
            return products.sort((a, b) => (a.discount_price || a.actual_price) - (b.discount_price || b.actual_price));
        }
        return products;
    }
});
