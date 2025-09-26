// Глобальні змінні
let visitHistory = [];
let filteredHistory = [];
let currentHistoryView = 'list';
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let currentCalendarMonth = new Date();
let selectedTraining = null;
let selectedRating = 0;
let trainers = [];
let categories = [];
let isEditingRating = false; // Нова змінна для відстеження режиму редагування

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    initializeHistoryPage();
});

// Ініціалізація сторінки
async function initializeHistoryPage() {
    try {
        await loadHistoryData();
        setupEventListeners();
    } catch (error) {
        console.error('Помилка ініціалізації:', error);
    }
}

// Завантаження всіх даних
async function loadHistoryData() {
    try {
        document.getElementById('loadingHistory').style.display = 'block';
        document.getElementById('historyContent').style.display = 'none';

        // Паралельно завантажуємо всі дані
        await Promise.all([
            loadVisitHistory(),
            loadTrainers(),
            loadCategories()
        ]);

        visitHistory.sort((a, b) => b.date - a.date);

        console.log('Завантажена історія відвідувань:', visitHistory);

        filteredHistory = [...visitHistory];

        calculateStatistics();
        populateFilters();
        displayHistory();

        document.getElementById('loadingHistory').style.display = 'none';
        document.getElementById('historyContent').style.display = 'block';

    } catch (error) {
        console.error('Помилка завантаження історії:', error);
        document.getElementById('loadingHistory').innerHTML = 'Помилка завантаження історії відвідувань';
    }
}

// Завантаження історії відвідувань
async function loadVisitHistory() {
    try {
        const response = await fetch('/user/all_bookings');
        if (!response.ok) {
            throw new Error('Помилка завантаження історії: ' + response.status);
        }

        const data = await response.json();
        
        // Обробляємо дані та конвертуємо дати
        visitHistory = data.map(item => ({
            ...item,
            date: new Date(item.date),
            bookingDate: new Date(item.bookingDate),
            completedAt: item.completedAt ? new Date(item.completedAt) : null
        }));

        filteredHistory = [...visitHistory];

    } catch (error) {
        console.error('Помилка завантаження історії:', error);
        // Якщо API недоступно, використовуємо тестові дані
        visitHistory = generateSampleHistory();
        filteredHistory = [...visitHistory];
    }
}

// Завантаження тренерів для фільтрів
async function loadTrainers() {
    try {
        const response = await fetch('/get_active_trainers');
        if (response.ok) {
            const result = await response.json();
            trainers = result.rows || [];
        }
    } catch (error) {
        console.error('Помилка завантаження тренерів:', error);
        trainers = [];
    }
}

// Завантаження категорій для фільтрів
async function loadCategories() {
    try {
        const response = await fetch('/get_categories');
        if (response.ok) {
            const result = await response.json();
            categories = result.rows || [];
        }
    } catch (error) {
        console.error('Помилка завантаження категорій:', error);
        categories = [];
    }
}

// Генерація тестових даних
function generateSampleHistory() {
    const sampleData = [];
    const statuses = ['attended', 'not_attended', 'cancelled'];
    const sampleCategories = [
        { id: 1, category: 'Силові тренування' },
        { id: 2, category: 'Кардіо' },
        { id: 3, category: 'Йога та розтяжка' },
        { id: 4, category: 'Групові заняття' },
        { id: 5, category: 'Функціональний тренінг' }
    ];
    const trainingTypes = ['Тренажерний зал', 'Біг', 'Хатха-йога', 'Зумба', 'Кросфіт', 'Бокс', 'Пілатес'];
    const trainerNames = ['Олександр Петренко', 'Марія Іваненко', 'Андрій Коваль', 'Катерина Мельник'];

    categories.push(...sampleCategories); // Додаємо тестові категорії

    for (let i = 0; i < 25; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Останні 3 місяці
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const trainingType = trainingTypes[Math.floor(Math.random() * trainingTypes.length)];
        const trainer = trainerNames[Math.floor(Math.random() * trainerNames.length)];
        const duration = [45, 60, 75, 90][Math.floor(Math.random() * 4)];
        const categoryData = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];

        sampleData.push({
            id: i + 1,
            trainingName: trainingType,
            trainerName: trainer,
            date: date,
            time: `${8 + Math.floor(Math.random() * 12)}:00`,
            duration: `${duration} хв`,
            status: status,
            price: 150 + Math.floor(Math.random() * 100),
            rating: status === 'attended' ? (Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null) : null,
            review: status === 'attended' && Math.random() > 0.7 ? 'Чудове тренування!' : null,
            bookingDate: new Date(date.getTime() - 24 * 60 * 60 * 1000), // день до тренування
            completedAt: status === 'attended' ? date : null,
            categoryId: categoryData.id,
            categoryName: categoryData.category
        });
    }

    return sampleData.sort((a, b) => b.date - a.date);
}

// Розрахунок статистики
function calculateStatistics() {
    const stats = {
        totalVisits: 0,
        totalHours: 0,
        currentMonth: 0,
        streak: 0
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Підрахунок загальної статистики
    visitHistory.forEach(visit => {
        if (visit.status === 'attended') {
            stats.totalVisits++;
            
            // Витягуємо години з duration
            const durationMatch = visit.duration.match(/(\d+)/);
            if (durationMatch) {
                stats.totalHours += parseInt(durationMatch[1]);
            }

            // Поточний місяць
            if (visit.date.getMonth() === currentMonth && visit.date.getFullYear() === currentYear) {
                stats.currentMonth++;
            }
        }
    });

    // Підрахунок streak (днів поспіль) - спрощена версія
    const completedDates = visitHistory
        .filter(v => v.status === 'attended')
        .map(v => v.date.toDateString())
        .filter((date, index, array) => array.indexOf(date) === index)
        .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < completedDates.length; i++) {
        const visitDate = new Date(completedDates[i]);
        const daysDiff = Math.floor((currentDate - visitDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= streak + 1) {
            streak++;
            currentDate = visitDate;
        } else {
            break;
        }
    }

    stats.streak = streak;

    // Конвертуємо хвилини в години
    const hours = Math.floor(stats.totalHours / 60);
    const minutes = stats.totalHours % 60;
    stats.totalHours = hours > 0 ? `${hours}г ${minutes}хв` : `${minutes}хв`;

    // Оновлюємо UI
    document.getElementById('totalVisits').textContent = stats.totalVisits;
    document.getElementById('totalHours').textContent = stats.totalHours;
    document.getElementById('currentMonth').textContent = stats.currentMonth;
    document.getElementById('streak').textContent = stats.streak;
}

// Заповнення фільтрів
function populateFilters() {
    // Заповнюємо фільтр категорій
    const categoryFilter = document.getElementById('categoryHistoryFilter');
    
    categoryFilter.innerHTML = '<option value="">Всі категорії</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.category;
        categoryFilter.appendChild(option);
    });

    // Заповнюємо фільтр тренерів
    const trainerFilter = document.getElementById('trainerHistoryFilter');
    const uniqueTrainers = [...new Set(visitHistory.map(v => v.trainerName))];
    
    trainerFilter.innerHTML = '<option value="">Всі тренери</option>';
    uniqueTrainers.forEach(trainer => {
        const option = document.createElement('option');
        option.value = trainer;
        option.textContent = trainer;
        trainerFilter.appendChild(option);
    });
}

// Застосування фільтрів
function applyHistoryFilters() {
    const periodFilter = document.getElementById('periodFilter').value;
    const categoryFilter = document.getElementById('categoryHistoryFilter').value;
    const trainerFilter = document.getElementById('trainerHistoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredHistory = visitHistory.filter(visit => {
        // Фільтр по періоду
        if (!matchesPeriodFilter(visit, periodFilter)) {
            return false;
        }

        // Фільтр по категорії
        if (categoryFilter && visit.categoryId != categoryFilter) {
            return false;
        }

        // Фільтр по тренеру
        if (trainerFilter && visit.trainerName !== trainerFilter) {
            return false;
        }

        // Фільтр по статусу
        if (statusFilter && visit.status !== statusFilter) {
            return false;
        }

        return true;
    });

    currentPage = 1;
    displayHistory();
}

// Перевірка відповідності періоду
function matchesPeriodFilter(visit, period) {
    const now = new Date();
    const visitDate = visit.date;

    switch (period) {
        case 'current-month':
            return visitDate.getMonth() === now.getMonth() && 
                   visitDate.getFullYear() === now.getFullYear();
        
        case 'last-month':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return visitDate.getMonth() === lastMonth.getMonth() && 
                   visitDate.getFullYear() === lastMonth.getFullYear();
        
        case 'last-3-months':
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return visitDate >= threeMonthsAgo;
        
        case 'current-year':
            return visitDate.getFullYear() === now.getFullYear();
        
        default: // 'all'
            return true;
    }
}

// Відображення історії
function displayHistory() {
    if (currentHistoryView === 'list') {
        displayHistoryList();
    } else {
        displayCalendarView();
    }
    
    updatePagination();
}

// Відображення списку історії
function displayHistoryList() {
    const historyList = document.getElementById('historyList');
    
    if (filteredHistory.length === 0) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>📝 Історія відвідувань порожня</h3>
                <p>Записи з'являться тут після відвідування тренувань</p>
            </div>
        `;
        return;
    }

    // Пагінація
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredHistory.slice(startIndex, endIndex);

    historyList.innerHTML = '';
    
    pageItems.forEach(visit => {
        const historyItem = createHistoryItem(visit);
        historyList.appendChild(historyItem);
    });
}

// Створення елементу історії
function createHistoryItem(visit) {
    const item = document.createElement('div');
    item.className = `history-item ${visit.status}`;

    const statusText = getStatusText(visit.status);
    const statusClass = `status-${visit.status}`;

    // Визначаємо, які кнопки показувати
    let actionButtons = `
        <button class="action-btn btn-details" onclick="showTrainingDetails(${visit.id})">
            📝 Деталі
        </button>
    `;

    if (visit.status === 'attended') {
        if (!visit.rating) {
            // Якщо немає оцінки - показуємо кнопку "Оцінити"
            actionButtons += `
                <button class="action-btn btn-rate" onclick="openRatingModal(${visit.id})">
                    ⭐ Оцінити
                </button>
            `;
        } else {
            // Якщо є оцінка - показуємо кнопку "Редагувати відгук"
            actionButtons += `
                <button class="action-btn btn-edit" onclick="editRating(${visit.id})">
                    ✏️ Редагувати відгук
                </button>
            `;
        }
    }

    item.innerHTML = `
        <div class="history-header">
            <div class="training-name">${visit.trainingName}</div>
            <div class="status-badge ${statusClass}">${statusText}</div>
        </div>
        
        <div class="history-info">
            <div class="info-item">
                <span>📂</span>
                <span>Категорія: ${visit.categoryName || 'Не вказана'}</span>
            </div>
            <div class="info-item">
                <span>🧑</span>
                <span>Тренер: ${visit.trainerName}</span>
            </div>
            <div class="info-item">
                <span>📅</span>
                <span>${visit.date.toLocaleDateString('uk-UA')} о ${visit.time}</span>
            </div>
            <div class="info-item">
                <span>⏱️</span>
                <span>${visit.duration}</span>
            </div>
            <div class="info-item">
                <span>💰</span>
                <span>${visit.price} грн</span>
            </div>
            ${visit.rating ? `
            <div class="info-item">
                <span>⭐</span>
                <span>${'★'.repeat(visit.rating)}${'☆'.repeat(5 - visit.rating)} (${visit.rating}/5)</span>
            </div>
            ` : ''}
            ${visit.review ? `
            <div class="info-item review-item">
                <span>💬</span>
                <span class="review-text">${visit.review}</span>
            </div>
            ` : ''}
        </div>

        <div class="history-actions">
            ${actionButtons}
        </div>
    `;

    return item;
}

// Отримання тексту статусу
function getStatusText(status) {
    switch (status) {
        case 'attended':
            return '✅ Відвідано';
        case 'not_attended':
            return '⚠️ Пропущено';
        case 'pending':
            return '⏳ Очікується';
        case 'cancelled':
            return '❌ Скасовано';
        default:
            return 'Невідомо';
    }
}

// Зміна виду історії
function setHistoryView(view) {
    currentHistoryView = view;
    
    // Оновлюємо активну кнопку
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Показуємо/приховуємо відповідні елементи
    const historyList = document.getElementById('historyList');
    const calendarView = document.getElementById('calendarView');
    const pagination = document.getElementById('pagination');
    
    if (view === 'list') {
        historyList.style.display = 'flex';
        calendarView.style.display = 'none';
        pagination.style.display = 'flex';
        displayHistoryList();
    } else {
        historyList.style.display = 'none';
        calendarView.style.display = 'block';
        pagination.style.display = 'none';
        displayCalendarView();
    }
}

// Відображення календарного виду
function displayCalendarView() {
    updateCalendarNavigation();
    generateCalendar();
}

// Оновлення навігації календаря
function updateCalendarNavigation() {
    const monthDisplay = document.getElementById('currentMonthDisplay');
    monthDisplay.textContent = currentCalendarMonth.toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long'
    });
}

// Зміна місяця в календарі
function changeMonth(delta) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + delta);
    displayCalendarView();
}

// Генерація календаря
function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    
    // Очищуємо календар
    calendarGrid.innerHTML = '';
    
    // Заголовки днів тижня
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    daysOfWeek.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Отримуємо перший та останній день місяця
    const firstDay = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), 1);
    const lastDay = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 0);
    
    // Початковий день тижня (понеділок = 0)
    const startDay = (firstDay.getDay() + 6) % 7;
    
    // Додаємо дні з попереднього місяця
    for (let i = startDay - 1; i >= 0; i--) {
        const day = new Date(firstDay);
        day.setDate(day.getDate() - i - 1);
        const dayElement = createCalendarDay(day, true);
        calendarGrid.appendChild(dayElement);
    }
    
    // Додаємо дні поточного місяця
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
        const dayElement = createCalendarDay(date, false);
        calendarGrid.appendChild(dayElement);
    }
    
    // Заповнюємо решту місць
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 рядків × 7 днів
    
    for (let i = 1; i <= remainingCells; i++) {
        const day = new Date(lastDay);
        day.setDate(lastDay.getDate() + i);
        const dayElement = createCalendarDay(day, true);
        calendarGrid.appendChild(dayElement);
    }
}

// Створення дня календаря
function createCalendarDay(date, isOtherMonth) {
    const day = document.createElement('div');
    day.className = 'calendar-day';
    
    if (isOtherMonth) {
        day.classList.add('other-month');
    }
    
    // Перевіряємо чи це сьогодні
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        day.classList.add('today');
    }
    
    // Знаходимо тренування на цей день
    const dayTrainings = filteredHistory.filter(visit => 
        visit.date.toDateString() === date.toDateString()
    );
    
    day.innerHTML = `
        <div class="day-number">${date.getDate()}</div>
        <div class="day-trainings">
            ${dayTrainings.map((training, index) => 
                `<div class="day-training ${training.status}" 
                      onclick="showTrainingDetails(${training.id})"
                      title="${training.trainingName} - ${training.time} (${training.categoryName || 'Без категорії'})">
                    <div class="training-short-name">${training.trainingName.substring(0, 10)}${training.trainingName.length > 10 ? '...' : ''}</div>
                    <div class="training-time">${training.time}</div>
                </div>`
            ).join('')}
        </div>
    `;
    
    return day;
}

// Оновлення пагінації
function updatePagination() {
    totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pageInfo.textContent = `Сторінка ${currentPage} з ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// Зміна сторінки
function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayHistoryList();
        updatePagination();
    }
}

// Показати деталі тренування
function showTrainingDetails(visitId) {
    const visit = visitHistory.find(v => v.id === visitId);
    if (!visit) return;

    selectedTraining = visit;
    
    const detailsHtml = `
        <div class="detail-section">
            <h3>Інформація про тренування</h3>
            <div class="detail-row">
                <span class="detail-label">Тип тренування:</span>
                <span class="detail-value">${visit.trainingName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Категорія:</span>
                <span class="detail-value">${visit.categoryName || 'Не вказана'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Тренер:</span>
                <span class="detail-value">${visit.trainerName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Дата та час:</span>
                <span class="detail-value">${visit.date.toLocaleDateString('uk-UA')} о ${visit.time}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Тривалість:</span>
                <span class="detail-value">${visit.duration}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Вартість:</span>
                <span class="detail-value">${visit.price} грн</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Статус:</span>
                <span class="detail-value">${getStatusText(visit.status)}</span>
            </div>
        </div>
        
        ${visit.rating ? `
        <div class="detail-section">
            <h3>Ваша оцінка</h3>
            <div class="detail-row">
                <span class="detail-label">Рейтинг:</span>
                <span class="detail-value">${'★'.repeat(visit.rating)}${'☆'.repeat(5 - visit.rating)} (${visit.rating}/5)</span>
            </div>
            ${visit.review ? `
            <div class="detail-row">
                <span class="detail-label">Відгук:</span>
                <span class="detail-value">${visit.review}</span>
            </div>
            ` : ''}
            <div class="detail-actions">
                <button class="btn btn-secondary" onclick="editRating(${visit.id}); closeDetailModal();">
                    ✏️ Редагувати оцінку
                </button>
            </div>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h3>Додаткова інформація</h3>
            <div class="detail-row">
                <span class="detail-label">Дата запису:</span>
                <span class="detail-value">${visit.bookingDate.toLocaleDateString('uk-UA')}</span>
            </div>
            ${visit.completedAt ? `
            <div class="detail-row">
                <span class="detail-label">Завершено:</span>
                <span class="detail-value">${visit.completedAt.toLocaleDateString('uk-UA')} о ${visit.completedAt.toLocaleTimeString('uk-UA', {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('trainingDetails').innerHTML = detailsHtml;
    document.getElementById('detailModal').style.display = 'block';
}

// Закрити модальне вікно деталей
function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
    selectedTraining = null;
}

// Відкрити модальне вікно оцінки (нове тренування)
function openRatingModal(visitId) {
    const visit = visitHistory.find(v => v.id === visitId);
    if (!visit) return;

    selectedTraining = visit;
    selectedRating = 0;
    isEditingRating = false;
    
    // Очищуємо форму
    document.getElementById('ratingTrainingName').textContent = visit.trainingName;
    document.getElementById('reviewText').value = '';
    document.getElementById('ratingText').textContent = 'Оберіть оцінку';
    
    // Скидаємо зірки
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
    });

    // Змінюємо заголовок та кнопку
    document.querySelector('#ratingModal .modal-header h2').textContent = '⭐ Оцініти тренування';
    document.querySelector('#ratingForm button[type="submit"]').textContent = 'Залишити оцінку';
    
    document.getElementById('ratingModal').style.display = 'block';
}

// Редагувати існуючу оцінку
function editRating(visitId) {
    const visit = visitHistory.find(v => v.id === visitId);
    if (!visit || !visit.rating) return;

    selectedTraining = visit;
    selectedRating = visit.rating;
    isEditingRating = true;
    
    // Заповнюємо форму існуючими даними
    document.getElementById('ratingTrainingName').textContent = visit.trainingName;
    document.getElementById('reviewText').value = visit.review || '';
    
    // Встановлюємо зірки
    updateStarRating();
    
    // Змінюємо заголовок та кнопку для режиму редагування
    document.querySelector('#ratingModal .modal-header h2').textContent = '✏️ Редагувати відгук';
    document.querySelector('#ratingForm button[type="submit"]').textContent = 'Зберегти зміни';
    
    document.getElementById('ratingModal').style.display = 'block';
}

// Закрити модальне вікно оцінки
function closeRatingModal() {
    document.getElementById('ratingModal').style.display = 'none';
    selectedTraining = null;
    selectedRating = 0;
    isEditingRating = false;
}

// Налаштування обробників подій
function setupEventListeners() {
    // Обробка кліків по зірках
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            updateStarRating();
        });
    });

    // Обробка форми оцінки
    document.getElementById('ratingForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (selectedRating === 0) {
            alert('Будь ласка, оберіть оцінку');
            return;
        }
        
        const review = document.getElementById('reviewText').value.trim();
        
        try {
            // Змінюємо URL залежно від режиму
            const url = isEditingRating ? 
                '/user/visit_history/update_rating' : 
                '/user/visit_history/rate_training';
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    visitId: selectedTraining.id,
                    rating: selectedRating,
                    review: review
                })
            });
            
            if (response.ok) {
                // Оновлюємо локальні дані
                selectedTraining.rating = selectedRating;
                selectedTraining.review = review;
                
                // Також оновлюємо в основному масиві
                const visitIndex = visitHistory.findIndex(v => v.id === selectedTraining.id);
                if (visitIndex !== -1) {
                    visitHistory[visitIndex].rating = selectedRating;
                    visitHistory[visitIndex].review = review;
                }
                
                // Оновлюємо відображення
                displayHistory();
                closeRatingModal();
                
                const message = isEditingRating ? 
                    '✅ Відгук успішно оновлено!' : 
                    '✅ Оцінка успішно збережена!';
                alert(message);
                
            } else {
                throw new Error('Помилка збереження оцінки');
            }
            
        } catch (error) {
            console.error('Помилка збереження оцінки:', error);
            const errorMessage = isEditingRating ? 
                'Помилка при оновленні відгуку. Спробуйте ще раз.' :
                'Помилка при збереженні оцінки. Спробуйте ще раз.';
            alert(errorMessage);
        }
    });

    // Закриття модальних вікон при кліку поза ними
    window.addEventListener('click', function(event) {
        const detailModal = document.getElementById('detailModal');
        const ratingModal = document.getElementById('ratingModal');
        
        if (event.target === detailModal) {
            closeDetailModal();
        } else if (event.target === ratingModal) {
            closeRatingModal();
        }
    });
}

// Оновлення відображення зірок
function updateStarRating() {
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    const ratingTexts = [
        'Оберіть оцінку',
        'Дуже погано',
        'Погано',
        'Нормально',
        'Добре',
        'Відмінно'
    ];
    
    document.getElementById('ratingText').textContent = ratingTexts[selectedRating];
}