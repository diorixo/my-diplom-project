const API_URL = '/api/bonus-shop';
let userBalance = 0;
let products = [];
let selectedProduct = null;

// Елементи DOM
const productsGrid = document.getElementById('productsGrid');
const loadingEl = document.getElementById('loading');
const errorMessageEl = document.getElementById('errorMessage');
const userBalanceEl = document.getElementById('userBalance');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const modal = document.getElementById('purchaseModal');
const modalClose = document.getElementById('modalClose');
const btnCancel = document.getElementById('btnCancel');
const btnConfirm = document.getElementById('btnConfirm');
const notification = document.getElementById('notification');

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupEventListeners();
});

const init = async () => {
    try {
        await fetchUserBalance();
        await fetchProducts();
    } catch (err) {
        console.error('Помилка ініціалізації:', err);
    }
}

// Налаштування обробників подій
function setupEventListeners() {
    categoryFilter.addEventListener('change', filterAndSortProducts);
    sortFilter.addEventListener('change', filterAndSortProducts);
    modalClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    btnConfirm.addEventListener('click', confirmPurchase);
    
    // Закриття модального вікна при кліку поза ним
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Завантаження балансу користувача
async function fetchUserBalance() {
    try {
        const response = await fetch('/balance');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        userBalance = data.balance;
        
        updateBalanceDisplay();
    } catch (error) {
        console.error('Помилка завантаження балансу:', error);
        userBalance = 0;
        updateBalanceDisplay();
    }
}

// Оновлення відображення балансу
function updateBalanceDisplay() {
    userBalanceEl.textContent = userBalance.toLocaleString('uk-UA');
}

// Завантаження товарів
async function fetchProducts() {
    try {
        loadingEl.classList.add('active');
        errorMessageEl.classList.remove('active');
        productsGrid.innerHTML = '';
        
        const response = await fetch('/products');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        products = data.rows;
        
        loadingEl.classList.remove('active');
        filterAndSortProducts();
        
    } catch (error) {
        console.error('Помилка завантаження товарів:', error);
        loadingEl.classList.remove('active');
        errorMessageEl.classList.add('active');
    }
}

// Фільтрація та сортування товарів
function filterAndSortProducts() {
    let filteredProducts = [...products];
    
    // Фільтрація за категорією
    const category = categoryFilter.value;
    if (category !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    // Сортування
    const sortType = sortFilter.value;
    switch (sortType) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
            break;
    }
    
    renderProducts(filteredProducts);
}

// Відображення товарів
function renderProducts(productsToRender) {
    productsGrid.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 40px;">Товарів не знайдено</p>';
        return;
    }
    
    productsToRender.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Створення картки товару
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const canAfford = userBalance >= product.price;
    const categoryNames = {
        'clothing': 'Одяг',
        'equipment': 'Обладнання',
        'accessories': 'Аксесуари',
        'subscriptions': 'Абонементи'
    };
    
    if (!canAfford) {
        card.classList.add('disabled');
    }
    
    card.innerHTML = `
        <img src="${product.image ? `/images/shop/${product.image}` : '/images/shop/placeholder.jpg'}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <div class="product-category">${categoryNames[product.category] || product.category}</div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-footer">
                <div class="product-price">
                    ${product.price.toLocaleString('uk-UA')}
                    <span class="product-price-label">балів</span>
                </div>
                <button class="btn-buy" ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? 'Купити' : 'Недостатньо балів'}
                </button>
            </div>
        </div>
    `;
    
    if (canAfford) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openPurchaseModal(product));
    }
    
    return card;
}

// Відкриття модального вікна покупки
function openPurchaseModal(product) {
    selectedProduct = product;
    
    document.getElementById('modalProductImage').src = product.image ? `/images/shop/${product.image}` : '/images/shop/placeholder.jpg';
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductPrice').textContent = product.price.toLocaleString('uk-UA');
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalCurrentBalance').textContent = userBalance.toLocaleString('uk-UA');
    document.getElementById('modalNewBalance').textContent = (userBalance - product.price).toLocaleString('uk-UA');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закриття модального вікна
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    selectedProduct = null;
}

// Підтвердження покупки
async function confirmPurchase() {
    if (!selectedProduct) return;
    
    try {
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Обробка...';
        
        const response = await fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: selectedProduct.id })
        });
        
        const data = await response.json();
        console.log(data)
        
        if (!response.ok) {
            throw new Error(data.message || 'Помилка покупки');
        }
        
        // // Оновлення балансу
        userBalance = data.newBalance;
        updateBalanceDisplay();
        
        // Показ повідомлення про успішну покупку
        showNotification(`Успішно придбано: ${selectedProduct.name}`);

        // Закриття модального вікна
        closeModal();
    
        // Оновлення відображення товарів
        filterAndSortProducts();
        
    } catch (error) {
        console.error('Помилка покупки:', error);
        alert(error.message || 'Помилка при покупці товару');
    } finally {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'Підтвердити покупку';
    }
}

// Показ повідомлення
function showNotification(message) {
    const notificationText = document.getElementById('notificationText');
    notificationText.textContent = message;
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}