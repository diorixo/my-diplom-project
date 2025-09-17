const trainerDataContainer = document.getElementById('trainerContent');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');

// Функція завантаження даних тренера
const fetchTrainerData = async () => {
    try {
        const response = await fetch('/get_trainer');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        
        // Заповнюємо основні дані тренера з таблиці users
        document.getElementById('fullName').textContent = `${data.firstName} ${data.lastName}`;
        document.getElementById('trainerId').textContent = data.userId;
        document.getElementById('username').textContent = data.username;
        document.getElementById('gender').textContent = data.gender === 'male' ? 'Чоловік' : 'Жінка';;
        document.getElementById('email').textContent = data.email;
        document.getElementById('phone').textContent = data.phone;
        document.getElementById('createdAt').textContent = data.created_at;
        document.getElementById('specialization').textContent = data.specialization;
        document.getElementById('rating').textContent = data.rating;
        
        // Статистика
        document.getElementById('sessionsThisMonth').textContent = data.sessionsThisMonth || '0';
        document.getElementById('monthlyRevenue').textContent = `${data.monthlyRevenue || '0'}₴`;
        document.getElementById('upcomingSessions').textContent = data.upcomingSessions || '0';
        
        // Встановлюємо відповідне зображення за статтю
        const trainerImage = document.getElementById('trainerImage');
        if (data.gender === 'male') {
            trainerImage.src = 'images/male.svg';
        } else {
            trainerImage.src = 'images/female.svg';
        }

        // Завантажуємо тренування тренера
        loadTrainerTrainings();

        // Показуємо контент і приховуємо завантаження
        loadingMessage.style.display = 'none';
        trainerDataContainer.style.display = 'block';
        
        // Додаємо анімацію появи
        trainerDataContainer.style.opacity = '0';
        trainerDataContainer.style.transform = 'translateY(20px)';
        setTimeout(() => {
            trainerDataContainer.style.transition = 'all 0.6s ease';
            trainerDataContainer.style.opacity = '1';
            trainerDataContainer.style.transform = 'translateY(0)';
        }, 100);

    } catch (error) {
        console.error('Error:', error);
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
    }
};

// Завантаження тренувань тренера з бази даних
const loadTrainerTrainings = async () => {
    try {
        const response = await fetch('/get_trainer_trainings');
        if (response.ok) {
            const trainingData = await response.json();
            displayTrainerTrainings(trainingData.trainings);
        }
    } catch (error) {
        console.error('Error loading trainer trainings:', error);
    }
};

// Відображення тренувань тренера замість розкладу
const displayTrainerTrainings = (trainings) => {
    const scheduleContainer = document.getElementById('todaySchedule');
    
    if (!trainings || trainings.length === 0) {
        scheduleContainer.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">Немає активних тренувань</p>';
        return;
    }
    
    scheduleContainer.innerHTML = '';
    
    trainings.forEach(training => {
        const trainingElement = document.createElement('div');
        trainingElement.className = 'schedule-item';
        trainingElement.innerHTML = `
            <span class="time">${training.duration} хв</span>
            <span class="client">${training.name}</span>
            <span class="type">${training.current_participants}/${training.max_participants}</span>
        `;
        scheduleContainer.appendChild(trainingElement);
    });
};

// Функції для дій тренера
function editProfile() {
    const modal = document.getElementById('editModal');
    
    // Заповнюємо форму поточними даними
    const fullNameText = document.getElementById('fullName').textContent;
    const nameParts = fullNameText.split(' ');
    
    document.getElementById('editFirstName').value = nameParts[0];
    document.getElementById('editLastName').value = nameParts[1];
    document.getElementById('editUsername').value = document.getElementById('username').textContent;
    document.getElementById('editEmail').value = document.getElementById('email').textContent;
    document.getElementById('editPhone').value = document.getElementById('phone').textContent;
    document.getElementById('editSpecialization').value = document.getElementById('specialization').textContent;
    
    const genderText = document.getElementById('gender').textContent;
    document.getElementById('editGender').value = genderText === 'Чоловік' ? 'male' : 'female';
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Блокуємо скролл фону
}

function viewFullSchedule() {
    // Перенаправлення на повний розклад
    window.location.href = '/trainer/schedule';
}

function manageClients() {
    // Перенаправлення на управління клієнтами
    window.location.href = '/trainer/clients';
}

function viewStatistics() {
    // Перенаправлення на детальну статистику
    window.location.href = '/trainer/statistics';
}

function createWorkoutPlan() {
    // Перенаправлення на створення плану тренувань
    window.location.href = '/trainer/create-plan';
}

function viewPayments() {
    // Перенаправлення на фінанси
    window.location.href = '/trainer/payments';
}

function manageAvailability() {
    // Перенаправлення на налаштування доступності
    window.location.href = '/trainer/availability';
}

function logout() {
    window.location.href = '/logout';
}

// Симуляція живих даних для демонстрації
function updateLiveStatistics() {
    // Оновлюємо статистику клієнтів (симуляція)
    const activeClients = Math.floor(Math.random() * 10) + 25;
    document.getElementById('activeClients').textContent = activeClients;
    
    // Оновлюємо кількість тренувань
    const sessions = Math.floor(Math.random() * 20) + 150;
    document.getElementById('sessionsThisMonth').textContent = sessions;
    
    // Оновлюємо дохід
    const revenue = (Math.floor(Math.random() * 15000) + 40000).toLocaleString();
    document.getElementById('monthlyRevenue').textContent = revenue + '₴';
    
    // Оновлюємо найближчі тренування
    const upcoming = Math.floor(Math.random() * 8) + 8;
    document.getElementById('upcomingSessions').textContent = upcoming;
}

// Ініціалізація модального вікна
const modal = document.getElementById('editModal');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const editForm = document.getElementById('editForm');
const successMessage = document.getElementById('successMessage');

// Закриття модального вікна
closeBtn.onclick = function() {
    closeModal();
}

cancelBtn.onclick = function() {
    closeModal();
}

function closeModal() {
    modal.style.display = 'none';
    successMessage.style.display = 'none';
    document.body.style.overflow = 'auto'; // Відновлюємо скролл
}

// Закриття при кліку поза модальним вікном
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Обробка форми редагування тренера
editForm.onsubmit = async function(e) {
    e.preventDefault();
        
    const formData = new FormData(editForm);
    const updateData = {
        firstname: formData.get('firstName'), // відповідно до структури БД
        lastname: formData.get('lastName'),
        username: formData.get('username'),
        gender: formData.get('gender'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        specialization: formData.get('specialization'),
        bio: formData.get('bio')
    };

    try {
        // Відправка на сервер
        const response = await fetch('/update_trainer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            // Оновлюємо дані на сторінці
            document.getElementById('fullName').textContent = `${updateData.firstname} ${updateData.lastname}`;
            document.getElementById('username').textContent = updateData.username;
            document.getElementById('gender').textContent = updateData.gender === 'male' ? 'Чоловік' : 'Жінка';
            document.getElementById('email').textContent = updateData.email;
            document.getElementById('phone').textContent = updateData.phone;
            document.getElementById('specialization').textContent = updateData.specialization;
            // document.getElementById('bio').textContent = updateData.bio;

            // Оновлюємо фото відповідно до статі
            const trainerImage = document.getElementById('trainerImage');
            trainerImage.src = updateData.gender === 'male' ? 'images/male.svg' : 'images/female.svg';
                
            // Показуємо повідомлення про успіх
            successMessage.style.display = 'block';
            
            // Закриваємо модальне вікно через 2 секунди
            setTimeout(() => {
                closeModal();
            }, 2000);
                
        } else {
            throw new Error('Помилка оновлення профілю тренера');
        }
    } catch (error) {
        console.error('Error updating trainer profile:', error);
        alert('Помилка при оновленні профілю тренера. Спробуйте ще раз.');
    }
};

// Додавання ефектів при завантаженні
document.addEventListener('DOMContentLoaded', function() {
    // Анімація для статистичних карток
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Ініціалізація
fetchTrainerData();

// Оновлюємо живі дані кожні 2 хвилини
// setInterval(updateLiveStatistics, 120000);