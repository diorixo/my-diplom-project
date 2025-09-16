// Глобальні змінні
let currentDate = new Date();
let currentView = 'day';
let trainings = [];
let trainers = [];
let userBookings = [];
let selectedBooking = null;

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadTrainers();
    loadTrainings();
    loadUserBookings();
});

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

// Завантаження тренерів
async function loadTrainers() {
    try {
        // Симуляція API виклику
        trainers = [
            { id: 1, name: 'Олександр Петренко', specialization: 'Силові тренування', avatar: 'О' },
            { id: 2, name: 'Марія Іваненко', specialization: 'Йога та пілатес', avatar: 'М' },
            { id: 3, name: 'Андрій Коваль', specialization: 'Кардіо та кросфіт', avatar: 'А' },
            { id: 4, name: 'Катерина Мельник', specialization: 'Аеробіка та фітнес', avatar: 'К' },
            { id: 5, name: 'Дмитро Сидоров', specialization: 'Бокс та єдиноборства', avatar: 'Д' }
        ];
        
        // Заповнюємо список тренерів у фільтрі
        const trainerSelect = document.getElementById('trainerFilter');
        trainers.forEach(trainer => {
            const option = document.createElement('option');
            option.value = trainer.id;
            option.textContent = trainer.name;
            trainerSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Помилка завантаження тренерів:', error);
    }
}

// Завантаження тренувань
async function loadTrainings() {
    try {
        document.getElementById('loadingSchedule').style.display = 'block';
        document.getElementById('scheduleContent').style.display = 'none';
        
        // Симуляція API виклику
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        trainings = generateSampleTrainings();
        
        document.getElementById('loadingSchedule').style.display = 'none';
        document.getElementById('scheduleContent').style.display = 'block';
        
        displayTrainings();
        
    } catch (error) {
        console.error('Помилка завантаження тренувань:', error);
        document.getElementById('loadingSchedule').innerHTML = 'Помилка завантаження розкладу';
    }
}

// Генерація зразкових тренувань
function generateSampleTrainings() {
    const types = [
        { type: 'gym', name: 'Тренажерний зал', duration: '60 хв', price: '200 грн' },
        { type: 'cardio', name: 'Кардіо тренування', duration: '45 хв', price: '150 грн' },
        { type: 'yoga', name: 'Йога', duration: '75 хв', price: '180 грн' },
        { type: 'pilates', name: 'Пілатес', duration: '60 хв', price: '170 грн' },
        { type: 'crossfit', name: 'Кросфіт', duration: '90 хв', price: '250 грн' },
        { type: 'boxing', name: 'Бокс', duration: '60 хв', price: '220 грн' },
        { type: 'swimming', name: 'Плавання', duration: '45 хв', price: '160 грн' }
    ];
    
    const times = ['08:00', '09:30', '11:00', '14:00', '16:00', '18:00', '19:30', '21:00'];
    const sampleTrainings = [];
    
    // Генеруємо тренування на поточний день
    const today = new Date(currentDate);
    
    for (let i = 0; i < 12; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const trainer = trainers[Math.floor(Math.random() * trainers.length)];
        const time = times[Math.floor(Math.random() * times.length)];
        const maxParticipants = Math.floor(Math.random() * 10) + 5;
        const currentParticipants = Math.floor(Math.random() * maxParticipants);
        
        const training = {
            id: i + 1,
            type: type.type,
            name: type.name,
            trainer: trainer,
            date: new Date(today),
            time: time,
            duration: type.duration,
            price: type.price,
            maxParticipants: maxParticipants,
            currentParticipants: currentParticipants,
            status: currentParticipants >= maxParticipants ? 'full' : 'available',
            isBooked: false
        };
        
        sampleTrainings.push(training);
    }
    
    return sampleTrainings;
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
    
    const statusText = training.status === 'full' ? 'Немає місць' : 
                     training.isBooked ? 'Записаний' : 'Доступно';
    const statusClass = training.status === 'full' ? 'status-full' : 
                       training.isBooked ? 'status-booked' : 'status-available';
    
    card.innerHTML = `
        <div class="status-badge ${statusClass}">${statusText}</div>
        <div class="training-header">
            <div class="training-type">${training.name}</div>
            <div class="training-time">${training.time}</div>
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
            <span class="price">💰 ${training.price}</span>
        </div>
        <div class="participants">
            👥 ${training.currentParticipants}/${training.maxParticipants} учасників
        </div>
        <button class="book-btn" 
                onclick="openBookingModal(${training.id})"
                ${training.status === 'full' || training.isBooked ? 'disabled' : ''}>
            ${training.isBooked ? '✅ Записаний' : training.status === 'full' ? '❌ Немає місць' : '📝 Записатися'}
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
        const trainingDate = training.date.toISOString().split('T')[0];
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
        trainings = generateSampleTrainings();
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
    trainings = generateSampleTrainings();
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
    if (!training || training.status === 'full' || training.isBooked) {
        return;
    }
    
    selectedBooking = training;
    
    // Заповнюємо дані в модальному вікні
    document.getElementById('modalTrainingType').textContent = training.name;
    document.getElementById('modalTrainer').textContent = training.trainer.name;
    document.getElementById('modalDateTime').textContent = 
        `${training.date.toLocaleDateString('uk-UA')} о ${training.time}`;
    document.getElementById('modalDuration').textContent = training.duration;
    document.getElementById('modalPrice').textContent = training.price;
    
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
            
            const notes = document.getElementById('bookingNotes').value;
            
            try {
                // Симуляція API виклику
                const response = await fetch('/book_training', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        trainingId: selectedBooking.id,
                        notes: notes,
                        trainingType: selectedBooking.type,
                        trainerId: selectedBooking.trainer.id,
                        date: selectedBooking.date.toISOString(),
                        time: selectedBooking.time
                    })
                });
                
                if (response.ok) {
                    // Оновлюємо статус тренування
                    selectedBooking.isBooked = true;
                    selectedBooking.currentParticipants += 1;
                    if (selectedBooking.currentParticipants >= selectedBooking.maxParticipants) {
                        selectedBooking.status = 'full';
                    }
                    
                    // Додаємо до моїх записів
                    userBookings.push({
                        id: Date.now(),
                        training: selectedBooking,
                        notes: notes,
                        bookingDate: new Date(),
                        status: 'active'
                    });
                    
                    // Показуємо повідомлення про успіх
                    document.getElementById('bookingSuccess').style.display = 'block';
                    
                    // Оновлюємо відображення
                    displayTrainings();
                    displayUserBookings();
                    
                    // Закриваємо модальне вікно через 2 секунди
                    setTimeout(() => {
                        closeModal();
                    }, 2000);
                    
                } else {
                    throw new Error('Помилка бронювання');
                }
                
            } catch (error) {
                console.error('Помилка бронювання:', error);
                alert('Помилка при створенні запису. Спробуйте ще раз.');
            }
        });
    }
});

// Завантаження записів користувача
async function loadUserBookings() {
    try {
        // Симуляція API виклику
        userBookings = [
            {
                id: 1,
                training: {
                    name: 'Йога',
                    trainer: { name: 'Марія Іваненко' },
                    date: new Date(2024, 11, 20),
                    time: '18:00',
                    duration: '75 хв'
                },
                notes: 'Перше заняття',
                bookingDate: new Date(2024, 11, 15),
                status: 'active'
            }
        ];
        
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
                <p>🧑‍🏫 Тренер: ${booking.training.trainer.name}</p>
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
    
    return hoursDiff > 2 && booking.status === 'active';
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
        // Симуляція API виклику
        const response = await fetch('/cancel_booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bookingId: selectedBooking.id
            })
        });
        
        if (response.ok) {
            // Оновлюємо статус запису
            selectedBooking.status = 'cancelled';
            
            // Оновлюємо тренування
            const training = trainings.find(t => t.id === selectedBooking.training.id);
            if (training) {
                training.isBooked = false;
                training.currentParticipants = Math.max(0, training.currentParticipants - 1);
                training.status = 'available';
            }
            
            // Видаляємо з активних записів
            userBookings = userBookings.filter(b => b.id !== selectedBooking.id);
            
            // Оновлюємо відображення
            displayTrainings();
            displayUserBookings();
            
            // Закриваємо модальне вікно
            closeCancelModal();
            
            alert('✅ Запис успішно скасовано!');
            
        } else {
            throw new Error('Помилка скасування');
        }
        
    } catch (error) {
        console.error('Помилка скасування:', error);
        alert('Помилка при скасуванні запису. Спробуйте ще раз.');
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