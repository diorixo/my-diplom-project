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
app.use(require('./routes/trainer_route'))
app.use(require('./routes/booking_route'))

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login_page', (req, res) => {
    res.render('login_page')
})

app.get('/user', authFunctions.authenticateToken, (req, res) => {
    res.render('user')
})

app.get('/trainer', authFunctions.authenticateToken, (req, res) => {
    res.render('trainer')
})

app.get('/trainer/manage_trainings', authFunctions.authenticateToken, (req, res) => {
    res.render('manage_trainings')
})

app.get('/training', authFunctions.authenticateToken, (req, res) => {
    res.render('training')
})

app.get('/training', authFunctions.authenticateToken, (req, res) => {
    res.render('training')
})

app.get('/user/visit_history', authFunctions.authenticateToken, (req, res) => {
    res.render('visit_history')
})

//не використвується
// app.get('/user_data', authFunctions.authenticateToken, (req, res) => {
//     const userId = req.user.userId;
//     const userRole = req.user.userRole;
//     res.json({ userId: userId, userRole: userRole, logged: true });
// })

app.get('/is_logged', authFunctions.isUserLoggedIn, (req, res) => {
    if (req.user) {
      res.json({ user_id: req.user.userId, user_role: req.user.userRole, logged: true });
    } else {
      res.json({ user_id: null, user_role: null, logged: false });
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.redirect('/');
});

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`)
})