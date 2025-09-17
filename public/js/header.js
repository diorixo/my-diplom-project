const fetchUserLogged = async () => {
    try {
        const response = await fetch('/is_logged');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result);

        const login_li = document.getElementById('login_li');
        const logout_li = document.getElementById('logout_li');
        const trainings_li = document.getElementById('trainings_li');
        const user_account_li = document.getElementById('user_account_li');
        const trainer_account_li = document.getElementById('trainer_account_li');
        const admin_account_li = document.getElementById('admin_account_li');

        if (result.logged && result.user_role === 'user') {
            logout_li.style.display = 'block';
            trainings_li.style.display = 'block';
            user_account_li.style.display = 'block';
        }
        else if (result.logged && result.user_role === 'trainer') {
            logout_li.style.display = 'block';
            trainer_account_li.style.display = 'block';
        }
        else {
            login_li.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
  
fetchUserLogged();