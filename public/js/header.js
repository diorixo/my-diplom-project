const fetchUserLogged = async () => {
    try {
        const response = await fetch('/is_logged');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result);
        logged = result.logged;

        const login_li = document.getElementById('login_li');
        const logout_li = document.getElementById('logout_li');
        const ocr_li = document.getElementById('ocr_li');
        const bd_li = document.getElementById('bd_li');

        if(logged) {
            logout_li.style.display = 'block';
            ocr_li.style.display = 'block';
            bd_li.style.display = 'block';
        }
        else {
            login_li.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
  
fetchUserLogged();