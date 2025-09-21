// Глобальні змінні
let currentDate = new Date();
let currentView = 'day';
let trainings = [];
let trainers = [];
let categories = [];
let trainingsAllData = [];
let userBookings = [];
let selectedBooking = null;

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    init();
    loadUserBookings();
});

const init = async () => {
    try {
        await Promise.all([loadCategories(), loadTrainers()]);
        await loadTrainings();
    } catch (err) {
        console.error('Помилка ініціалізації:', err);
    }
}

// Ініціалізація сторінки
function initializePage() {
    // Встановлюємо мінімальну дату (сьогодні)
    const today = new Date();
    const dateFilter = document.getElementById('dateFilter');
    dateFilter.min = today.toISOString().split('T')[0];
    
    // Встановлюємо максимальну дату (через 30 днів)
    const maxDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    dateFilter.max = maxDate.toISOString().split('T')[0];
    
    // Встановлюємо поточну дату
    dateFilter.value = today.toISOString().split('T')[0];
    
    updateDateDisplay();
}

// Завантаження категорій
const loadCategories = async () => {
    try {
        const response = await fetch('/get_categories');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        categories = result.rows

        // Заповнюємо список категорій у фільтрі
        const categorySelect = document.getElementById('typeFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.category;
            option.textContent = category.category;
            categorySelect.appendChild(option);
        });

    } catch (error) {
        console.error('Помилка завантаження категорій:', error);
    }
}

// Завантаження тренерів
const loadTrainers = async () => {
    try {
        const response = await fetch('/get_active_trainers');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        trainers = result.rows;

        if (trainers.length !== 0) {
            // Заповнюємо список тренерів у фільтрі
            const trainerSelect = document.getElementById('trainerFilter');
            trainers.forEach(trainer => {
                const option = document.createElement('option');
                option.value = trainer.id;
                option.textContent = trainer.firstname + ' ' + trainer.lastname;
                trainerSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Помилка завантаження тренерів:', error);
    }
}

// Функція перевірки чи тренування вже минуло або розпочалося
function isTrainingExpired(training) {
    const now = new Date();
    const trainingDateTime = new Date(training.date);
    const [hours, minutes] = training.time.split(':');
    trainingDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    // Тренування вважається минулим, якщо воно вже розпочалося
    return now >= trainingDateTime;
}

// Функція перевірки чи можна записатися на тренування
function canBookTraining(training) {
    // Перевіряємо чи тренування не переповнене
    if (training.status === 'full') {
        return false;
    }
    
    // Перевіряємо чи користувач вже записаний
    if (training.isBooked) {
        return false;
    }
    
    // Перевіряємо чи тренування не минуло
    if (isTrainingExpired(training)) {
        return false;
    }
    
    return true;
}

// Завантаження тренувань
const loadTrainings = async () => {
    try {
        const response = await fetch('/get_active_trainings');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        trainings = result.rows;

        // Формуємо фінальний масив
        const trainingsAllData = trainings.map((t) => {
            const trainer = trainers.find(tr => tr.id === t.trainer_id);
            const category = categories.find(cat => cat.id === t.category_id);
        
            const training = {
                id: t.id,
                type: category ? category.category : 'unknown',
                name: t.name,
                trainer: trainer ? {
                    id: trainer.id,
                    name: `${trainer.firstname} ${trainer.lastname}`,
                    specialization: trainer.specialization || 'unknown',
                    avatar: trainer.avatar || 'NO'
                } : {
                    id: null,
                    name: 'unknown',
                    specialization: 'unknown',
                    avatar: 'NO'
                },
                date: new Date(t.date),
                time: t.time,
                duration: `${t.duration} хв`,
                price: t.price,
                maxParticipants: t.max_participants,
                currentParticipants: t.current_participants,
                isBooked: false
            };

            // Визначаємо статус тренування
            if (isTrainingExpired(training)) {
                training.status = 'expired';
            } else if (training.currentParticipants >= training.maxParticipants) {
                training.status = 'full';
            } else {
                training.status = 'available';
            }

            return training;
        });

        trainings = trainingsAllData;

        document.getElementById('loadingSchedule').style.display = 'none';
        document.getElementById('scheduleContent').style.display = 'block';
        
        displayTrainings();

    } catch (error) {
        console.error('Помилка завантаження тренувань:', error);
        document.getElementById('loadingSchedule').innerHTML = 'Помилка завантаження розкладу';
    }
}

// Відображення тренувань
function displayTrainings() {
    const trainingGrid = document.getElementById('trainingGrid');
    trainingGrid.innerHTML = '';
    
    const filteredTrainings = applyCurrentFilters();
    
    if (filteredTrainings.length === 0) {
        trainingGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <h3>😔 Тренування не знайдені</h3>
                <p>Спробуйте змінити фільтри або оберіть іншу дату</p>
            </div>
        `;
        return;
    }
    
    filteredTrainings.forEach(training => {
        const trainingCard = createTrainingCard(training);
        trainingGrid.appendChild(trainingCard);
    });
}

// Створення картки тренування
function createTrainingCard(training) {
    const card = document.createElement('div');
    card.className = `training-card ${training.status}`;
    if (training.isBooked) {
        card.classList.add('booked');
    }
    
    // Визначаємо текст та клас статусу
    let statusText, statusClass, buttonText, isDisabled;
    
    if (training.status === 'expired') {
        statusText = 'Минуло';
        statusClass = 'status-expired';
        buttonText = '⏰ Минуло';
        isDisabled = true;
    } else if (training.status === 'full') {
        statusText = 'Немає місць';
        statusClass = 'status-full';
        buttonText = '❌ Немає місць';
        isDisabled = true;
    } else if (training.isBooked) {
        statusText = 'Записаний';
        statusClass = 'status-booked';
        buttonText = '✅ Записаний';
        isDisabled = true;
    } else {
        statusText = 'Доступно';
        statusClass = 'status-available';
        buttonText = '📝 Записатися';
        isDisabled = false;
    }
    
    card.innerHTML = `
        <div class="status-badge ${statusClass}">${statusText}</div>
        <div class="training-header">
            <div class="training-type">${training.name}</div>
            <div class="training-time">${training.time.slice(0, 5)}</div>
        </div>
        <div class="trainer-info">
            <div class="trainer-avatar">${training.trainer.avatar}</div>
            <div>
                <div class="trainer-name">${training.trainer.name}</div>
                <div style="font-size: 0.8em; color: #888;">${training.trainer.specialization}</div>
            </div>
        </div>
        <div class="training-details">
            <span class="duration">⏱️ ${training.duration}</span>
            <span class="price">💰 ${training.price} грн</span>
        </div>
        <div class="participants">
            👥 ${training.currentParticipants}/${training.maxParticipants} учасників
        </div>
        <button class="book-btn" 
                onclick="openBookingModal(${training.id})"
                ${isDisabled ? 'disabled' : ''}>
            ${buttonText}
        </button>
    `;
    
    return card;
}

// Застосування поточних фільтрів
function applyCurrentFilters() {
    const dateFilter = document.getElementById('dateFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const trainerFilter = document.getElementById('trainerFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    
    let filtered = trainings.filter(training => {
        // Фільтр по даті
        const date = training.date;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // місяці від 0
        const day = String(date.getDate()).padStart(2, '0');
        const trainingDate = `${year}-${month}-${day}`;
        if (dateFilter && trainingDate !== dateFilter) {
            return false;
        }

        // Фільтр по типу
        if (typeFilter && training.type !== typeFilter) {
            return false;
        }
        
        // Фільтр по тренеру
        if (trainerFilter && training.trainer.id.toString() !== trainerFilter) {
            return false;
        }
        
        // Фільтр по часу
        if (timeFilter) {
            const hour = parseInt(training.time.split(':')[0]);
            switch (timeFilter) {
                case 'morning':
                    if (hour < 6 || hour >= 12) return false;
                    break;
                case 'afternoon':
                    if (hour < 12 || hour >= 18) return false;
                    break;
                case 'evening':
                    if (hour < 18 || hour >= 22) return false;
                    break;
            }
        }
        
        return true;
    });
    
    return filtered.sort((a, b) => a.time.localeCompare(b.time));
}

// Застосування фільтрів
function applyFilters() {
    const dateValue = document.getElementById('dateFilter').value;
    if (dateValue) {
        currentDate = new Date(dateValue);
        updateDateDisplay();
    }
    displayTrainings();
}

// Зміна виду (день/тиждень)
function setView(view) {
    currentView = view;
    
    // Оновлюємо активну кнопку
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Поки що реалізуємо тільки денний вид
    if (view === 'week') {
        alert('Тижневий вид буде доданий пізніше');
        setView('day');
        return;
    }
    
    displayTrainings();
}

// Зміна дати
function changeDate(delta) {
    currentDate.setDate(currentDate.getDate() + delta);
    
    // Не дозволяємо вибирати минулі дати
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (currentDate < today) {
        currentDate = new Date(today);
        return;
    }
    
    // Не дозволяємо вибирати дати більше ніж через 30 днів
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (currentDate > maxDate) {
        currentDate = new Date(maxDate);
        return;
    }
    
    updateDateDisplay();
    document.getElementById('dateFilter').value = currentDate.toISOString().split('T')[0];
    displayTrainings();
}

// Оновлення відображення дати
function updateDateDisplay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const displayDate = new Date(currentDate);
    displayDate.setHours(0, 0, 0, 0);
    
    const dateDisplay = document.getElementById('currentDateDisplay');
    
    if (displayDate.getTime() === today.getTime()) {
        dateDisplay.textContent = 'Сьогодні';
    } else {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (displayDate.getTime() === tomorrow.getTime()) {
            dateDisplay.textContent = 'Завтра';
        } else {
            dateDisplay.textContent = currentDate.toLocaleDateString('uk-UA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
}

// Відкриття модального вікна бронювання
function openBookingModal(trainingId) {
    const training = trainings.find(t => t.id === trainingId);
    
    // Перевіряємо чи можна записатися на це тренування
    if (!training || !canBookTraining(training)) {
        // Показуємо відповідне повідомлення залежно від причини
        if (training.status === 'full') {
            alert('❌ На це тренування немає вільних місць');
        } else if (training.isBooked) {
            alert('✅ Ви вже записані на це тренування');
        } else if (training.status === 'expired') {
            alert('⏰ Це тренування вже минуло або розпочалося');
        } else {
            alert('❌ Неможливо записатися на це тренування');
        }
        return;
    }
    
    selectedBooking = training;
    
    // Заповнюємо дані в модальному вікні
    document.getElementById('modalTrainingType').textContent = training.name;
    document.getElementById('modalTrainer').textContent = training.trainer.name;
    document.getElementById('modalDateTime').textContent = 
        `${training.date.toLocaleDateString('uk-UA')} о ${training.time.slice(0, 5)}`;
    document.getElementById('modalDuration').textContent = training.duration;
    document.getElementById('modalPrice').textContent = training.price + ' грн';
    
    // Очищуємо форму
    document.getElementById('bookingNotes').value = '';
    document.getElementById('bookingSuccess').style.display = 'none';
    
    // Показуємо модальне вікно
    document.getElementById('bookingModal').style.display = 'block';
}

// Закриття модального вікна бронювання
function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    selectedBooking = null;
}

// Обробка форми бронювання
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!selectedBooking) return;
            
            // Додаткова перевірка перед відправкою
            if (!canBookTraining(selectedBooking)) {
                alert('❌ Неможливо записатися на це тренування (можливо, воно вже минуло або переповнене)');
                closeModal();
                return;
            }
            
            const notes = document.getElementById('bookingNotes').value;
            
            try {
                const response = await fetch('/traininng/book_training', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        training_id: selectedBooking.id,
                        notes: notes
                    })
                });
                
                if (response.ok) {
                    // Показуємо повідомлення про успіх
                    document.getElementById('bookingSuccess').style.display = 'block';
                    
                    // Оновлюємо відображення
                    init();
                    loadUserBookings();
                    displayTrainings();
                    displayUserBookings();
                    
                    // Закриваємо модальне вікно через 2 секунди
                    setTimeout(() => {
                        closeModal();
                    }, 2000);
                    
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Помилка бронювання');
                }
                
            } catch (error) {
                console.error('Помилка бронювання:', error);
                alert('Помилка при створенні запису: ' + error.message);
            }
        });
    }
});

// Завантаження записів користувача
async function loadUserBookings() {
    try {
        const response = await fetch('/user/bookings');
        if (!response.ok) {
            throw new Error('Помилка завантаження: ' + response.status);
        }

        const data = await response.json();

        // Конвертуємо дати у Date-об'єкти
        userBookings = data.map(booking => ({
            ...booking,
            bookingDate: new Date(booking.bookingDate),
            training: {
                ...booking.training,
                date: new Date(booking.training.date),
                time: booking.training.time.slice(0, 5) // залишаємо тільки HH:MM
            }
        }));

        displayUserBookings();

    } catch (error) {
        console.error('Помилка завантаження записів:', error);
    }
}

// Відображення записів користувача
function displayUserBookings() {
    const bookingsList = document.getElementById('myBookings');
    
    if (userBookings.length === 0) {
        bookingsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>📝 Записів поки немає</h4>
                <p>Оберіть тренування зі списку вище та створіть свій перший запис!</p>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = '';
    
    userBookings.forEach(booking => {
        const bookingItem = document.createElement('div');
        bookingItem.className = 'booking-item';
        
        const canCancel = canCancelBooking(booking);
        
        bookingItem.innerHTML = `
            <div class="booking-info">
                <h4>${booking.training.name}</h4>
                <p>🧑 Тренер: ${booking.training.trainer.name}</p>
                <p>📅 ${booking.training.date.toLocaleDateString('uk-UA')} о ${booking.training.time}</p>
                <p>⏱️ Тривалість: ${booking.training.duration}</p>
                ${booking.notes ? `<p>📝 Примітки: ${booking.notes}</p>` : ''}
            </div>
            <div class="booking-actions">
                <button class="cancel-btn" 
                        onclick="openCancelModal(${booking.id})"
                        ${!canCancel ? 'disabled style="opacity: 0.5;"' : ''}>
                    ${!canCancel ? '🕐 Не можна скасувати' : '❌ Скасувати'}
                </button>
            </div>
        `;
        
        bookingsList.appendChild(bookingItem);
    });
}

// Перевірка чи можна скасувати запис
function canCancelBooking(booking) {
    const now = new Date();
    const trainingDateTime = new Date(booking.training.date);
    const [hours, minutes] = booking.training.time.split(':');
    trainingDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    // Можна скасувати мінімум за 2 години до початку
    const timeDiff = trainingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 2;
}

// Відкриття модального вікна скасування
function openCancelModal(bookingId) {
    const booking = userBookings.find(b => b.id === bookingId);
    if (!booking || !canCancelBooking(booking)) {
        return;
    }
    
    selectedBooking = booking;
    
    // Заповнюємо деталі запису
    document.getElementById('cancelBookingDetails').innerHTML = `
        <div class="detail-row">
            <span class="label">Тренування:</span>
            <span class="value">${booking.training.name}</span>
        </div>
        <div class="detail-row">
            <span class="label">Тренер:</span>
            <span class="value">${booking.training.trainer.name}</span>
        </div>
        <div class="detail-row">
            <span class="label">Дата та час:</span>
            <span class="value">${booking.training.date.toLocaleDateString('uk-UA')} о ${booking.training.time}</span>
        </div>
    `;
    
    // Показуємо модальне вікно
    document.getElementById('cancelModal').style.display = 'block';
}

// Закриття модального вікна скасування
function closeCancelModal() {
    document.getElementById('cancelModal').style.display = 'none';
    selectedBooking = null;
}

// Підтвердження скасування
async function confirmCancel() {
    if (!selectedBooking) return;
    
    try {
        const response = await fetch('/user/cancel_booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: selectedBooking.id
            })
        });
        
        if (response.ok) {
            // Оновлюємо відображення
            init();
            loadUserBookings();
            displayTrainings();
            displayUserBookings();
            
            // Закриваємо модальне вікно
            closeCancelModal();
            
            alert('✅ Запис успішно скасовано!');
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Помилка скасування');
        }
        
    } catch (error) {
        console.error('Помилка скасування:', error);
        alert('Помилка при скасуванні запису: ' + error.message);
    }
}

// Закриття модальних вікон при кліку поза ними
window.onclick = function(event) {
    const bookingModal = document.getElementById('bookingModal');
    const cancelModal = document.getElementById('cancelModal');
    
    if (event.target === bookingModal) {
        closeModal();
    } else if (event.target === cancelModal) {
        closeCancelModal();
    }
}