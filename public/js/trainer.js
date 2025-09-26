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
        document.getElementById('totalReviews').textContent = data.totalReviews;
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
        const response = await fetch('/trainer/get_trainer_active_trainings');
        if (response.ok) {
            const trainingData = await response.json();
            displayTrainerTrainings(trainingData.trainings);
        }
    } catch (error) {
        console.error('Error loading trainer trainings:', error);
    }
};

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
    <div class="schedule-left">
        <span class="date-time">${formatDate(training.date)} ${formatTime(training.time)}</span>
        <span class="training-name">${training.name}</span>
        <span class="category">${training.category}</span>
    </div>
    <div class="schedule-middle">
        👥 ${training.current_participants}/${training.max_participants}
    </div>
    <div class="schedule-right">
        <span class="price">💰 ${training.price}₴</span>
        <span class="duration">⏱ ${training.duration} хв</span>
    </div>
`;

        scheduleContainer.appendChild(trainingElement);
    });
};

// Завантаження останніх відгуків
const loadTrainerReviews = async () => {
    try {
        const response = await fetch('/trainer/get_reviews');
        if (response.ok) {
            const data = await response.json();
            console.log(data);
            displayTrainerReviews(data.reviews);
        }
    } catch (error) {
        console.error('Error loading trainer reviews:', error);
    }
};

const displayTrainerReviews = (reviews) => {
    const reviewsContainer = document.getElementById('reviewsList');
    reviewsContainer.innerHTML = '';

    if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML = '<p style="color: #7f8c8d; text-align:center;">Відгуків ще немає</p>';
        return;
    }

    reviews.forEach(r => {
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        const reviewer = `${r.firstname} ${r.lastname.charAt(0)}.`;

        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        reviewElement.innerHTML = `
            <div class="review-header">
                <span class="reviewer">${reviewer}</span>
                <span class="review-rating">${stars}</span>
            </div>
            <p class="review-text">"${r.review}"</p>
        `;
        reviewsContainer.appendChild(reviewElement);
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

function viewSchedule() {
    // Перенаправлення на повний розклад
    window.location.href = '/trainer/manage_trainings';
}

function logout() {
    window.location.href = '/logout';
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

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // місяці з 0
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

// Ініціалізація
fetchTrainerData();
loadTrainerReviews();