const userDataContainer = document.getElementById('userContent');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');

const fetchUserData = async () => {
    try {
        const response = await fetch('/get_user');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
                
        // Заповнюємо дані користувача
        document.getElementById('fullName').textContent = `${data.firstName} ${data.lastName}`;
        document.getElementById('userId').textContent = data.userId;
        document.getElementById('username').textContent = data.username;
        document.getElementById('gender').textContent = data.gender;
        document.getElementById('roleBadge').textContent = data.userRole;
            
        // Встановлюємо відповідне зображення залежно від статі
        const profileImage = document.getElementById('profileImage');
        if (data.gender === 'Чоловік') {
            profileImage.src = 'images/male.svg';
        } else {
            profileImage.src = 'images/female.svg';
        }

        // Показуємо контент і приховуємо завантаження
        loadingMessage.style.display = 'none';
        userDataContainer.style.display = 'block';
            
        // Додаємо анімацію появи
        userDataContainer.style.opacity = '0';
        userDataContainer.style.transform = 'translateY(20px)';
        setTimeout(() => {
            userDataContainer.style.transition = 'all 0.5s ease';
            userDataContainer.style.opacity = '1';
            userDataContainer.style.transform = 'translateY(0)';
        }, 100);

    } catch (error) {
        console.error('Error:', error);
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
    }
};

// Функції для дій користувача
function editProfile() {
    alert('Перенаправлення на сторінку редагування профілю...');
    // window.location.href = '/edit-profile';
}

function viewSchedule() {
    alert('Перенаправлення на розклад занять...');
    // window.location.href = '/schedule';
}

function bookTraining() {
    alert('Перенаправлення на запис на тренування...');
    // window.location.href = '/book-training';
}

function viewHistory() {
    alert('Перенаправлення на історію відвідувань...');
    // window.location.href = '/visit-history';
}

function paymentHistory() {
    alert('Перенаправлення на історію платежів...');
    // window.location.href = '/payments';
}

function logout() {
    if (confirm('Ви впевнені, що хочете вийти?')) {
        window.location.href = '/logout';
    }
}

// Симуляція живих даних (можна замінити на реальні API виклики)
function updateLiveData() {
    // Оновлюємо статистику відвідувань (симуляція)
    const visitCount = Math.floor(Math.random() * 30) + 10;
    document.getElementById('visitCount').textContent = visitCount;
    
    // Оновлюємо прогрес
    const progress = Math.floor(Math.random() * 100);
    const progressBar = document.getElementById('monthProgress');
    progressBar.style.width = progress + '%';
    progressBar.textContent = progress + '%';
}

// Завантажуємо дані при завантаженні сторінки
fetchUserData();

// Оновлюємо деякі дані кожні 30 секунд (опціонально)
// setInterval(updateLiveData, 30000);