// JavaScript для сторінки користувача спорт залу - оновлений

// Отримання посилань на елементи
const userDataContainer = document.getElementById('userContent');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');

// Функція для розрахунку прогресу місяця
function calculateMonthProgress(visitCount) {
    // Припустимо, що ціль - 20 відвідувань на місяць
    const monthlyGoal = 20;
    const progress = Math.min(Math.round((visitCount / monthlyGoal) * 100), 100);
    return progress;
}

// Функція завантаження даних користувача
const fetchUserData = async () => {
    try {
        const response = await fetch('/get_user');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        
        // Заповнюємо дані користувача
        document.getElementById('fullName').textContent = `${data.firstname} ${data.lastname}`;
        document.getElementById('userId').textContent = data.userId;
        document.getElementById('username').textContent = data.username;
        document.getElementById('gender').textContent = data.gender === 'male' ? 'Чоловік' : 'Жінка';
        document.getElementById('email').textContent = data.email;
        document.getElementById('phone').textContent = data.phone || 'Не вказано';
        document.getElementById('memberSince').textContent = data.created_at;
        document.getElementById('totalTrainings').textContent = data.total_visits || 0; 
        
        // Відображаємо баланс бонусів
        const balance = data.balance || 0;
        document.getElementById('bonusBalance').textContent = balance;
        
        // Розраховуємо та відображаємо прогрес місяця
        const progress = calculateMonthProgress(data.visit_count);
        const progressBar = document.getElementById('monthProgress');
        progressBar.style.width = progress + '%';
        document.getElementById('progressPercentText').textContent = progress + '%';
        document.getElementById('currentVisits').textContent = data.visit_count || 0;
        
        // Встановлюємо відповідне зображення залежно від статі
        const profileImage = document.getElementById('profileImage');
        if (data.gender === 'male') {
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
    const modal = document.getElementById('editModal');
    
    // Заповнюємо форму поточними даними
    const fullNameText = document.getElementById('fullName').textContent;
    const nameParts = fullNameText.split(' ');
    
    document.getElementById('editFirstName').value = nameParts[0] || '';
    document.getElementById('editLastName').value = nameParts[1] || '';
    document.getElementById('editUsername').value = document.getElementById('username').textContent;
    document.getElementById('editEmail').value = document.getElementById('email').textContent;
    
    const phoneText = document.getElementById('phone').textContent;
    document.getElementById('editPhone').value = phoneText === 'Не вказано' ? '' : phoneText;
    
    const genderText = document.getElementById('gender').textContent;
    document.getElementById('editGender').value = genderText === 'Чоловік' ? 'male' : 'female';
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Блокуємо скролл фону
}

function viewSchedule() {
    alert('Перенаправлення на розклад занять...');
    // window.location.href = '/schedule';
}

function bookTraining() {
    window.location.href = '/training';
}

function viewHistory() {
    window.location.href = '/user/visit_history';
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

// Ініціалізація модального вікна
const modal = document.getElementById('editModal');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const editForm = document.getElementById('editForm');
const successMessage = document.getElementById('successMessage');

function closeModal() {
    modal.style.display = 'none';
    successMessage.style.display = 'none';
    document.body.style.overflow = 'auto'; // Відновлюємо скролл
}

// Закриття модального вікна
closeBtn.onclick = function() {
    closeModal()
}

cancelBtn.onclick = function() {
    closeModal()
}

// Закриття при кліку поза модальним вікном
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal()
    }
}

// Обробка форми редагування
editForm.onsubmit = async function(e) {
    e.preventDefault();
        
    const formData = new FormData(editForm);
    const updateData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        username: formData.get('username'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        gender: formData.get('gender')
    };

    try {
        // Відправка на сервер
        const response = await fetch('/update_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            // Оновлюємо дані на сторінці
            document.getElementById('fullName').textContent = `${updateData.firstName} ${updateData.lastName}`;
            document.getElementById('username').textContent = updateData.username;
            document.getElementById('email').textContent = updateData.email;
            document.getElementById('phone').textContent = updateData.phone || 'Не вказано';
            document.getElementById('gender').textContent = updateData.gender === 'male' ? 'Чоловік' : 'Жінка';
                
            // Оновлюємо фото відповідно до статі
            const profileImage = document.getElementById('profileImage');
            profileImage.src = updateData.gender === 'male' ? 'images/male.svg' : 'images/female.svg';
                
            // Показуємо повідомлення про успіх
            successMessage.style.display = 'block';
            
            // Закриваємо модальне вікно через 2 секунди
            setTimeout(() => {
                closeModal()
            }, 2000);
                
        } else {
            throw new Error('Помилка оновлення профілю');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Помилка при оновленні профілю. Спробуйте ще раз.');
    }
};

fetchUserData();