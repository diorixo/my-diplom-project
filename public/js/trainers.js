// Функція для заповнення фільтру спеціалізацій
function populateSpecializationFilter() {
    const specs = [...new Set(allTrainers.map(t => t.specialization).filter(Boolean))];
    const select = document.getElementById('specializationFilter');
    
    specs.forEach(spec => {
        const option = document.createElement('option');
        option.value = spec;
        option.textContent = spec;
        select.appendChild(option);
    });
}// Змінні
let allTrainers = [];

// Функція для отримання аватара тренера
function getTrainerAvatar(trainer) {
    if (trainer.avatar_url) {
        return `<img src="/images/trainers/${trainer.avatar_url}" alt="${trainer.firstname} ${trainer.lastname}" class="trainer-avatar-img">`;
    }
    
    // Якщо аватара немає, показуємо ініціали
    const initial = getAvatarInitial(trainer.firstname, trainer.lastname);
    return `<div class="trainer-avatar-initial">${initial}</div>`;
}

// Функція для генерування зірок рейтингу
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.round(rating)) {
            stars += '<span class="star">★</span>';
        } else {
            stars += '<span class="star" style="opacity: 0.3;">★</span>';
        }
    }
    return stars;
}

// Функція для створення карточки тренера
function createTrainerCard(trainer) {
    const avatarHtml = getTrainerAvatar(trainer);
    const starsHtml = trainer.rating > 0 ? generateStars(trainer.rating) : '';
    
    return `
        <div class="trainer-card" data-trainer-id="${trainer.trainer_id}">
            <div class="trainer-avatar">
                ${avatarHtml}
            </div>
            <div class="trainer-info">
                <div class="trainer-name">${trainer.firstname} ${trainer.lastname}</div>
                <div class="trainer-specialization">${trainer.specialization || 'Тренер'}</div>
                ${trainer.bio ? `<div class="trainer-bio">${trainer.bio}</div>` : ''}
                
                <div class="trainer-rating">
                    <div class="stars">${starsHtml}</div>
                    <span class="rating-text">${trainer.rating.toFixed(1)} / 5</span>
                </div>
                
                <div class="trainer-stats">
                    <div class="stat">
                        <span class="stat-value">${trainer.rating.toFixed(1)}</span>
                        <span class="stat-label">Рейтинг</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${trainer.total_reviews}</span>
                        <span class="stat-label">Відгуків</span>
                    </div>
                </div>
                
                <button class="trainer-action" onclick="bookTrainer(${trainer.trainer_id})">
                    Записатися до тренера
                </button>
            </div>
        </div>
    `;
}

// Функція для завантаження тренерів
async function loadTrainers() {
    try {
        const response = await fetch('/api/trainers');
        if (!response.ok) throw new Error('Помилка завантаження');
        
        allTrainers = await response.json();
        
        // Конвертуємо rating та total_reviews в числа
        allTrainers = allTrainers.map(trainer => ({
            ...trainer,
            rating: parseFloat(trainer.rating) || 0,
            total_reviews: parseInt(trainer.total_reviews) || 0
        }));
        
        renderTrainers(allTrainers);
    } catch (error) {
        console.error('Помилка:', error);
        document.getElementById('trainers-grid').innerHTML = 
            '<p style="grid-column: 1/-1; text-align: center;">Помилка завантаження тренерів</p>';
    }
}

// Функція для рендерингу тренерів
function renderTrainers(trainers) {
    const grid = document.getElementById('trainers-grid');
    const noResults = document.getElementById('no-results');
    
    if (trainers.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
    } else {
        grid.innerHTML = trainers.map(trainer => createTrainerCard(trainer)).join('');
        noResults.style.display = 'none';
    }
}

// Функція для заповнення фільтру спеціалізацій
function populateSpecializationFilter() {
    const specs = [...new Set(allTrainers.map(t => t.specialization).filter(Boolean))];
    const select = document.getElementById('specializationFilter');
    
    specs.forEach(spec => {
        const option = document.createElement('option');
        option.value = spec;
        option.textContent = spec;
        select.appendChild(option);
    });
}

// Функція для фільтрації тренерів
function filterTrainers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allTrainers.filter(trainer => {
        const nameMatch = 
            `${trainer.firstname} ${trainer.lastname}`.toLowerCase().includes(searchTerm);
        
        return nameMatch;
    });
    
    renderTrainers(filtered);
}

// Функція для запису до тренера
function bookTrainer(trainerId) {
    // Зберігаємо ID тренера в sessionStorage
    sessionStorage.setItem('selectedTrainerId', trainerId);
    
    // Редирект на сторінку запису на тренування
    window.location.href = '/training';
}

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    loadTrainers();
    
    // Слухач для пошуку
    document.getElementById('searchInput').addEventListener('input', filterTrainers);
});