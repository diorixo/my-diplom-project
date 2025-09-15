const login_msg = document.getElementById('login_msg');

loginForm.addEventListener('submit', async (event) => {
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
        });

        const result = await response.json();
    
        if (!response.ok) {
            if(response.status === 401) {
                console.log(result.error);
                login_msg.innerHTML = result.error;
                login_msg.style.color = 'red';
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        console.log(result.message);
        login_msg.innerHTML = result.message;
        login_msg.style.color = 'green';
    
        window.location.href = '/';
    } catch (error) {
        console.error('Error:', error);
    }
});

const register_msg = document.getElementById('register_msg');

document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username_input_register').value;
    const firstname = document.getElementById('firstname_input_register').value;
    const lastname = document.getElementById('lastname_input_register').value;
    const gender = document.querySelector('input[name="gender_input_register"]:checked').value;
    const password = document.getElementById('password_input_register').value;
    const password_confirm = document.getElementById('password_input_register_confirm').value;

    if (password !== password_confirm) {
        register_msg.innerHTML = 'Паролі не співпадають';
        register_msg.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, firstname, lastname, gender, password })
        });

        const result = await response.json();

        if (!response.ok) {
            if(response.status === 409) {
                console.log(result.error);
                register_msg.innerHTML = result.error;
                register_msg.style.color = 'red';
            }
            throw new Error(`HTTP error ${response.status}`);
        }

        console.log(result.message);
        register_msg.innerHTML = result.message;
        register_msg.style.color = 'green';
    } catch (error) {
        console.error('Помилка:', error);
    }
});

const loginBtn = document.querySelector('.login-btn');
const registerBtn = document.querySelector('.register-btn');
const formBox = document.querySelector('.form-box');
const body = document.body;

registerBtn.addEventListener('click', function () {
    formBox.classList.add('active');
    body.classList.add('active');
});

loginBtn.addEventListener('click', function () {
    formBox.classList.remove('active');
    body.classList.remove('active');
});