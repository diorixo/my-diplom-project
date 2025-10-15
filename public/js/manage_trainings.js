let currentTab = 'active';
let trainings = [];
let categories = [];
let allUsers = [];
let selectedParticipantsMap = new Map(); // Map<userId, {id, firstname, lastname, email}>
let currentEditingId = null;
let currentParticipants = [];
let currentTrainingId = null;

// Ініціалізація сторінки
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadTrainings();
    loadUsers();
    setupModals();
    setupUserSearch();

    // Обмеження для дати (від сьогодні до +30 днів)
    const trainingDateInput = document.getElementById('trainingDate');
    const personalTrainingDateInput = document.getElementById('personalTrainingDate');
    
    if (trainingDateInput) {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);

        const toISODate = (date) => date.toISOString().split('T')[0];

        trainingDateInput.min = toISODate(today);
        trainingDateInput.max = toISODate(nextMonth);
    }

    if (personalTrainingDateInput) {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);

        const toISODate = (date) => date.toISOString().split('T')[0];

        personalTrainingDateInput.min = toISODate(today);
        personalTrainingDateInput.max = toISODate(nextMonth);
    }
});

// ===== КОРИСТУВАЧІ ДЛЯ ПЕРСОНАЛОК =====
// Завантажити всіх користувачів з роллю 'user'
async function loadUsers() {
    try {
        const response = await fetch('/get_all_users');
        const data = await response.json();
        allUsers = data.users || [];
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Пошук користувачів
function setupUserSearch() {
    const searchInput = document.getElementById('userSearch');
    const searchResults = document.getElementById('userSearchResults');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            searchResults.innerHTML = '';
            return;
        }
        
        const filtered = allUsers.filter(user => {
            // Перевіряємо, чи не доданий вже
            if (selectedParticipantsMap.has(user.id)) return false;
            
            const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
            const email = user.email.toLowerCase();
            return fullName.includes(query) || email.includes(query);
        });
        
        if (filtered.length === 0) {
            searchResults.innerHTML = '<div class="no-results">Користувачів не знайдено</div>';
            searchResults.classList.add('active');
            return;
        }
        
        searchResults.innerHTML = filtered.map(user => `
            <div class="user-search-item" onclick="addParticipant(${user.id})">
                <div class="user-search-name">${user.firstname} ${user.lastname}</div>
                <div class="user-search-email">${user.email}</div>
            </div>
        `).join('');
        
        searchResults.classList.add('active');
    });
    
    // Закрити результати при кліку поза
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

// Додати учасника
function addParticipant(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user || selectedParticipantsMap.has(userId)) return;
    
    selectedParticipantsMap.set(userId, user);
    updateSelectedParticipantsList();
    
    // Очистити пошук
    document.getElementById('userSearch').value = '';
    document.getElementById('userSearchResults').classList.remove('active');
}

// Видалити учасника
function removeParticipant(userId) {
    selectedParticipantsMap.delete(userId);
    updateSelectedParticipantsList();
}

// Оновити відображення обраних учасників
function updateSelectedParticipantsList() {
    const container = document.getElementById('selectedParticipantsList');
    
    if (selectedParticipantsMap.size === 0) {
        container.innerHTML = '<p class="empty-participants">Жодного учасника не обрано</p>';
        return;
    }
    
    container.innerHTML = Array.from(selectedParticipantsMap.values()).map(user => `
        <div class="selected-participant-tag">
            <span class="selected-participant-name">${user.firstname} ${user.lastname}</span>
            <button type="button" class="remove-participant-btn" onclick="removeParticipant(${user.id})" title="Видалити">×</button>
        </div>
    `).join('');
}

// ===== КАТЕГОРІЇ =====

// Завантаження категорій для форми
async function loadCategories() {
    try {
        const response = await fetch('/get_categories');
        const data = await response.json();
        categories = data.rows;
        
        const categorySelect = document.getElementById('categoryId');
        const personalCategorySelect = document.getElementById('personalCategoryId');
        
        const optionsHTML = '<option value="">Оберіть категорію</option>' + 
            categories.map(category => `<option value="${category.id}">${category.category}</option>`).join('');
        
        if (categorySelect) {
            categorySelect.innerHTML = optionsHTML;
        }
        
        if (personalCategorySelect) {
            personalCategorySelect.innerHTML = optionsHTML;
        }
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ===== ЗАВАНТАЖЕННЯ ТРЕНУВАНЬ =====

// Завантаження всіх тренувань
async function loadTrainings() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        
        const response = await fetch('/trainer/get_trainer_trainings');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        trainings = data.trainings;

        console.log('Loaded trainings:', trainings);
        
        displayTrainings();
        
    } catch (error) {
        console.error('Error loading trainings:', error);
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// Відображення тренувань у відповідній вкладці
function displayTrainings() {
    const activeGrid = document.getElementById('activeTrainingsGrid');
    const completedGrid = document.getElementById('completedTrainingsGrid');
    
    const activeTrainings = trainings.filter(t => t.status === 'active');
    const completedTrainings = trainings.filter(t => t.status === 'completed');
    
    activeGrid.innerHTML = '';
    completedGrid.innerHTML = '';
    
    // Відображення активних тренувань
    if (activeTrainings.length === 0) {
        activeGrid.innerHTML = `
            <div class="empty-state">
                <h3>😔 Немає активних тренувань</h3>
                <p>Створіть своє перше тренування, натиснувши кнопку "Додати тренування"</p>
            </div>
        `;
    } else {
        activeTrainings.forEach(training => {
            activeGrid.appendChild(createTrainingCard(training));
        });
    }
    
    // Відображення завершених тренувань
    if (completedTrainings.length === 0) {
        completedGrid.innerHTML = `
            <div class="empty-state">
                <h3>📋 Немає завершених тренувань</h3>
                <p>Тут з'являться тренування після їх завершення</p>
            </div>
        `;
    } else {
        completedTrainings.forEach(training => {
            completedGrid.appendChild(createTrainingCard(training));
        });
    }
}

// Створення картки тренування
function createTrainingCard(training) {
    const card = document.createElement('div');
    const isPersonal = training.visible === false;
    card.className = `training-card ${isPersonal ? 'personal' : ''} ${training.status === 'completed' ? 'completed' : ''}`;
    
    const occupancyRate = training.max_participants > 0 
        ? (training.current_participants / training.max_participants) * 100 
        : 0;
    
    const categoryName = categories.find(c => c.id === training.category_id)?.category || 'Не вказано';
    const badgeText = isPersonal ? '👤 Персональне' : '👥 Групове';
    const badgeClass = isPersonal ? 'badge-personal' : 'badge-group';
    
    card.innerHTML = `
        <div class="training-header">
            <h3 class="training-name">${training.name}</h3>
            <span class="training-status ${badgeClass}">
                ${badgeText}
            </span>
        </div>
        
        <div class="training-category">${categoryName}</div>
        
        <div class="training-info">
            <div class="info-item">
                <span class="info-label">Дата:</span>
                <span class="info-value">${TrainingUtils.formatDate(training.date)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Час:</span>
                <span class="info-value">${training.time.slice(0,5)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Тривалість:</span>
                <span class="info-value">${training.duration} хв</span>
            </div>
            <div class="info-item">
                <span class="info-label">Ціна:</span>
                <span class="info-value">${training.price}₴</span>
            </div>
        </div>
        
        <div class="participants-bar">
            <div class="participants-label">Учасники:</div>
            <div class="progress-bar">
                <div class="progress-fill ${occupancyRate >= 100 ? 'full' : ''}" style="width: ${Math.min(occupancyRate, 100)}%"></div>
            </div>
            <div class="participants-text">${training.current_participants} з ${training.max_participants}</div>
        </div>
        
        <div class="training-actions">
            <button class="action-btn-small view" onclick="viewParticipants(${training.id})">
                👥 Учасники
            </button>
            ${training.status === 'active' ? `
                <button class="action-btn-small edit" onclick="editTraining(${training.id})">
                    ✏️ Редагувати
                </button>
                <button class="action-btn-small complete" onclick="completeTraining(${training.id})">
                    ✅ Завершити
                </button>
                <button class="action-btn-small delete" onclick="deleteTraining(${training.id})">
                    🗑️ Видалити
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// ===== ПЕРЕМИКАННЯ ВКЛАДОК =====

// Перемикання вкладок
function switchTab(tab) {
    currentTab = tab;
    
    // Оновлення кнопок вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Показ/приховування секцій
    document.getElementById('activeTrainings').style.display = tab === 'active' ? 'block' : 'none';
    document.getElementById('completedTrainings').style.display = tab === 'completed' ? 'block' : 'none';
}

// ===== ГРУПОВІ ТРЕНУВАННЯ =====

// Відкриття модального вікна додавання групового тренування
function openAddTrainingModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = '➕ Додати групове тренування';
    document.getElementById('trainingForm').reset();
    document.getElementById('trainingId').value = '';
    document.getElementById('trainingModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Редагування групового тренування
function editTraining(trainingId) {
    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;
    
    currentEditingId = trainingId;
    document.getElementById('modalTitle').textContent = '✏️ Редагувати тренування';
    
    // Заповнення форми
    document.getElementById('trainingId').value = training.id;
    document.getElementById('trainingName').value = training.name;
    document.getElementById('categoryId').value = training.category_id;
    document.getElementById('trainingDate').value = TrainingUtils.formatDateForInput(training.date);
    document.getElementById('trainingTime').value = training.time;
    document.getElementById('duration').value = training.duration;
    document.getElementById('price').value = training.price;
    document.getElementById('maxParticipants').value = training.max_participants;
    
    document.getElementById('trainingModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Закриття модального вікна групового тренування
function closeTrainingModal() {
    document.getElementById('trainingModal').style.display = 'none';
    document.getElementById('trainingSuccessMessage').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentEditingId = null;
}

// Обробка форми групового тренування
document.getElementById('trainingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const trainingData = {
        id: currentEditingId,
        name: formData.get('name'),
        category_id: formData.get('categoryId'),
        duration: parseInt(formData.get('duration')),
        price: parseInt(formData.get('price')),
        max_participants: parseInt(formData.get('maxParticipants')),
        date: formData.get('date'),
        time: formData.get('time'),
        visible: true
    };

    try {
        let response;
        if (currentEditingId) {
            // Редагування
            response = await fetch(`/trainer/update_training`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(trainingData)
            });
        } else {
            // Додавання нового
            response = await fetch('/trainer/create_training', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(trainingData)
            });
        }
        
        if (response.ok) {
            const successMessage = document.getElementById('trainingSuccessMessage');
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                closeTrainingModal();
                loadTrainings();
            }, 1500);
        } else {
            throw new Error('Помилка збереження тренування');
        }
        
    } catch (error) {
        console.error('Error saving training:', error);
        alert('Помилка при збереженні тренування. Спробуйте ще раз.');
    }
});

// ===== ПЕРСОНАЛЬНІ ТРЕНУВАННЯ =====

// Відкриття модального вікна додавання персонального тренування
function openAddPersonalTrainingModal() {
    selectedParticipantsMap.clear();
    document.getElementById('personalTrainingForm').reset();
    updateSelectedParticipantsList();
    
    document.getElementById('personalTrainingModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Закриття модального вікна персонального тренування
function closePersonalTrainingModal() {
    document.getElementById('personalTrainingModal').style.display = 'none';
    document.getElementById('personalTrainingSuccessMessage').style.display = 'none';
    document.body.style.overflow = 'auto';
    selectedParticipantsMap.clear();
}

// Обробка форми персонального тренування
document.getElementById('personalTrainingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (selectedParticipantsMap.size === 0) {
        alert('Будь ласка, оберіть хоча б одного учасника');
        return;
    }
    
    const formData = new FormData(this);
    const trainingData = {
        name: formData.get('name'),
        category_id: formData.get('categoryId'),
        duration: parseInt(formData.get('duration')),
        price: parseInt(formData.get('price')),
        date: formData.get('date'),
        time: formData.get('time'),
        max_participants: selectedParticipantsMap.size,
        visible: false
    };

    try {
        // 1. Спочатку створюємо тренування
        const response = await fetch('/trainer/create_training', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(trainingData)
        });
        
        if (!response.ok) {
            throw new Error('Помилка створення тренування');
        }
        
        const result = await response.json();
        const trainingId = result.id;
        
        // 2. Потім додаємо учасників через bookings
        const selectedIds = Array.from(selectedParticipantsMap.keys());
        for (const userId of selectedIds) {
            await fetch('/add_booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    user_id: userId, 
                    training_id: trainingId 
                })
            });
        }
        
        const successMessage = document.getElementById('personalTrainingSuccessMessage');
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            closePersonalTrainingModal();
            loadTrainings();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving personal training:', error);
        alert('Помилка при збереженні персонального тренування. Спробуйте ще раз.');
    }
});

// ===== ЗАВЕРШЕННЯ ТРЕНУВАННЯ =====

// Завершення тренування
async function completeTraining(trainingId) {
    if (!confirm('Ви впевнені, що хочете завершити це тренування?')) {
        return;
    }
    
    try {
        const response = await fetch(`/trainer/training_set_status_complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: trainingId })
        });
        
        if (response.ok) {
            loadTrainings();
        } else {
            throw new Error('Помилка завершення тренування');
        }
        
    } catch (error) {
        console.error('Error completing training:', error);
        alert('Помилка при завершенні тренування.');
    }
}

// ===== ВИДАЛЕННЯ ТРЕНУВАННЯ =====

let trainingToDelete = null;

// Видалення тренування
function deleteTraining(trainingId) {
    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;
    
    trainingToDelete = trainingId;
    document.getElementById('deleteTrainingName').textContent = training.name;
    document.getElementById('deleteModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function confirmDelete() {
    if (!trainingToDelete) return;
    
    performDelete(trainingToDelete);
}

async function performDelete(trainingId) {
    try {
        const response = await fetch(`/trainer/training/${trainingId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            closeDeleteModal();
            loadTrainings();
        } else {
            console.error('Error deleting training:', response.statusText);
            throw new Error('Помилка видалення тренування');
        }
        
    } catch (error) {
        console.error('Error deleting training:', error);
        alert('Помилка при видаленні тренування.');
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    trainingToDelete = null;
}

// ===== УЧАСНИКИ =====

// Перегляд учасників
async function viewParticipants(trainingId) {
    currentTrainingId = trainingId;
    const training = trainings.find(t => t.id === trainingId);
    
    if (!training) return;
    
    document.getElementById('participantsModalTitle').textContent = `👥 Учасники: ${training.name}`;
    
    try {
        const response = await fetch(`/trainer/training/${trainingId}/participants`);
        const data = await response.json();
        
        currentParticipants = data.participants;
        displayParticipants();
        
        document.getElementById('participantsModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error loading participants:', error);
        alert('Помилка завантаження учасників.');
    }
}

// Відображення списку учасників
function displayParticipants() {
    const participantsList = document.getElementById('participantsList');
    const totalParticipants = document.getElementById('totalParticipants');
    const attendedParticipants = document.getElementById('attendedParticipants');
    const notAttendedParticipants = document.getElementById('notAttendedParticipants');
    
    // Підрахунок статистики
    const total = currentParticipants.length;
    const attended = currentParticipants.filter(p => p.attendance === 'attended').length;
    const notAttended = currentParticipants.filter(p => p.attendance === 'not_attended').length;
    
    totalParticipants.textContent = total;
    attendedParticipants.textContent = attended;
    notAttendedParticipants.textContent = notAttended;
    
    // Очищення списку
    participantsList.innerHTML = '';
    
    if (currentParticipants.length === 0) {
        participantsList.innerHTML = `
            <div class="empty-state">
                <h3>😔 Немає учасників</h3>
                <p>Поки що ніхто не записався на це тренування</p>
            </div>
        `;
        return;
    }
    
    // Створення елементів учасників
    currentParticipants.forEach((participant, index) => {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-item';
        
        participantDiv.innerHTML = `
            <div class="participant-info">
                <div class="participant-name">${participant.firstname} ${participant.lastname}</div>
                <div class="participant-details">
                    📧 ${participant.email} | 📞 ${participant.phone}<br>
                    📅 Записався: ${new Date(participant.created_at).toLocaleDateString('uk-UA')}
                    ${participant.notes ? `<br>💬 ${participant.notes}` : ''}
                </div>
            </div>
            <div class="attendance-controls">
                <button class="attendance-btn ${participant.attendance === 'attended' ? 'attended' : ''}" 
                        onclick="setAttendance(${index}, 'attended')">
                    ✅ Прийшов
                </button>
                <button class="attendance-btn ${participant.attendance === 'not_attended' ? 'not-attended' : ''}" 
                        onclick="setAttendance(${index}, 'not_attended')">
                    ❌ Не прийшов
                </button>
                <button class="attendance-btn ${participant.attendance === 'pending' ? 'pending' : ''}" 
                        onclick="setAttendance(${index}, 'pending')">
                    ⏳ Очікування
                </button>
            </div>
        `;
        
        participantsList.appendChild(participantDiv);
    });
}

// Встановлення статусу відвідуваності
function setAttendance(participantIndex, status) {
    currentParticipants[participantIndex].attendance = status;
    displayParticipants();
}

// Збереження відвідуваності
async function saveAttendance() {
    if (!currentTrainingId) return;
    
    const attendanceData = currentParticipants.map(participant => ({
        bookingId: participant.booking_id,
        attendance: participant.attendance
    }));
    
    try {
        const response = await fetch(`/trainer/manage_trainings/${currentTrainingId}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ attendance: attendanceData })
        });
        
        if (response.ok) {
            alert('Відвідуваність успішно збережена!');
            closeParticipantsModal();
        } else {
            throw new Error('Помилка збереження відвідуваності');
        }
        
    } catch (error) {
        console.error('Error saving attendance:', error);
        alert('Помилка при збереженні відвідуваності.');
    }
}

// Закриття модального вікна учасників
function closeParticipantsModal() {
    document.getElementById('participantsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentTrainingId = null;
    currentParticipants = [];
}

// ===== МОДАЛЬНІ ВІКНА =====

// Налаштування модальних вікон
function setupModals() {
    // Закриття модальних вікон при кліку на хрестик
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Приховування повідомлень про успіх
            document.querySelectorAll('.success-message').forEach(msg => {
                msg.style.display = 'none';
            });
        });
    });
    
    // Закриття при кліку поза модальним вікном
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Приховування повідомлень про успіх
            document.querySelectorAll('.success-message').forEach(msg => {
                msg.style.display = 'none';
            });
        }
    });
}

// ===== УТИЛІТАРНІ ФУНКЦІЇ =====

const TrainingUtils = {
    // Форматування дати
    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('uk-UA', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    },

    formatDateForInput: (dateString) => {
        const date = new Date(dateString);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    },
    
    // Розрахунок доходу від тренування
    calculateTrainingRevenue: (training) => {
        return training.current_participants * training.price;
    },
    
    // Перевірка заповненості тренування
    isTrainingFull: (training) => {
        return training.current_participants >= training.max_participants;
    },
    
    // Отримання кольору статусу
    getStatusColor: (status) => {
        const colors = {
            'active': '#27ae60',
            'completed': '#95a5a6',
            'cancelled': '#e74c3c'
        };
        return colors[status] || '#95a5a6';
    }
};