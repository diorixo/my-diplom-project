const jwt = require('jsonwebtoken');
const {secretKey} = require('./secretKey')

function authenticateToken(req, res, next) {
    const token = req.cookies.access_token;

    if (!token) {
        return res.redirect('/login_page');
        //return res.status(401).json({ error: 'Authorization token missing' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            res.clearCookie('access_token');
            return res.redirect('/login_page');
            //return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = decoded;
        next();
    });
}

function isUserLoggedIn(req, res, next) {
    const token = req.cookies.access_token;

    if (!token) {
        return next();
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            res.clearCookie('authToken');
            return next();
        }
        req.user = decoded;
        next();
    });
}

module.exports = {
    authenticateToken,
    isUserLoggedIn
}