// Перемикання табів
const tabs = document.querySelectorAll('.tab');
const tabIndicator = document.querySelector('.tab-indicator');
const formWrapper = document.querySelector('.form-wrapper');
const loginMsg = document.getElementById('login_msg');
const registerMsg = document.getElementById('register_msg');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
    
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    
        if (targetTab === 'register') {
            tabIndicator.classList.add('register-active');
            formWrapper.classList.add('show-register');
        } else {
            tabIndicator.classList.remove('register-active');
            formWrapper.classList.remove('show-register');
        }
    
        // Очищення повідомлень
        loginMsg.textContent = '';
        loginMsg.className = 'message';
        registerMsg.textContent = '';
        registerMsg.className = 'message';
    });
});

// Обробка форми входу
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const username = document.getElementById('username_input_login').value;
    const password = document.getElementById('password_input_login').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        const result = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                loginMsg.textContent = result.error;
                loginMsg.className = 'message error';
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        loginMsg.textContent = result.message;
        loginMsg.className = 'message success';
        
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
    }
});

// Обробка форми реєстрації
document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username_input_register').value;
    const firstname = document.getElementById('firstname_input_register').value;
    const lastname = document.getElementById('lastname_input_register').value;
    const email = document.getElementById('email_input_register').value;
    const phone = document.getElementById('phone_input_register').value;
    const gender = document.querySelector('input[name="gender_input_register"]:checked').value;
    const password = document.getElementById('password_input_register').value;
    const password_confirm = document.getElementById('password_input_register_confirm').value;

    if (password !== password_confirm) {
        registerMsg.textContent = 'Паролі не співпадають';
        registerMsg.className = 'message error';
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, firstname, lastname, email, phone, gender, password })
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 409) {
                registerMsg.textContent = result.error;
                registerMsg.className = 'message error';
            }
            throw new Error(`HTTP error ${response.status}`);
        }

        registerMsg.textContent = result.message;
        registerMsg.className = 'message success';

        // Очищення форми після успішної реєстрації
        setTimeout(() => {
            document.getElementById('registerForm').reset();
            // Перемикання на вхід
            tabs[0].click();
        }, 2000);
    } catch (error) {
        console.error('Помилка:', error);
    }
});