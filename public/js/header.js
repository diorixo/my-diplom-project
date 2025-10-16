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
        const user_account_li = document.getElementById('user_account_li');
        const trainer_account_li = document.getElementById('trainer_account_li');
        const admin_account_li = document.getElementById('admin_account_li');
        const bonus_shop_li = document.getElementById('bonus_shop_li');

        if (result.logged && result.user_role === 'user') {
            bonus_shop_li.style.display = 'block';
            logout_li.style.display = 'block';
            user_account_li.style.display = 'block';
        }
        else if (result.logged && result.user_role === 'trainer') {
            logout_li.style.display = 'block';
            trainer_account_li.style.display = 'block';
        }
        else if (result.logged && result.user_role === 'admin') {
            logout_li.style.display = 'block';
            admin_account_li.style.display = 'block';
        }
        else {
            login_li.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
  
fetchUserLogged();