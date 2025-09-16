const express = require('express')
const cookieParser = require('cookie-parser');
const authFunctions = require('./services/session');
const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
//app.use(express.urlencoded({ extended: false }))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser());


app.use(require('./routes/user_route'))
app.use(require('./routes/training_route'))
app.use(require('./routes/category_route'))

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login_page', (req, res) => {
    res.render('login_page')
})

app.get('/account', authFunctions.authenticateToken, (req, res) => {
    res.render('account')
})

app.get('/training', authFunctions.authenticateToken, (req, res) => {
    res.render('training')
})

//поискать что это
app.get('/user_data', authFunctions.authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.userRole;
    res.json({ userId: userId, userRole: userRole });
})

//поискать что это
app.get('/is_logged', authFunctions.isUserLoggedIn, (req, res) => {
    if (req.user) {
      res.json({ logged: true });
    } else {
      res.json({ logged: false });
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.render('index');
});

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`)
})