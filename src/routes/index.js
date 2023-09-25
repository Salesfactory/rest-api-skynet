const express = require('express');
const CognitoExpress = require('cognito-express');
const router = express.Router();
const userRouter = require('./users');
const channelRouter = require('./channels');
const clientRouter = require('./clients');
const campaigntRouter = require('./campaigns');
const emailRouter = require('./emails');
const notificationRouter = require('./notifications');

let cognitoExpress;
if (process.env.NODE_ENV !== 'test') {
    cognitoExpress = new CognitoExpress({
        region: process.env.COGNITO_REGION,
        cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
        tokenUse: 'access',
        tokenExpiration: 3600000,
    });
}

const validateToken = (req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        const authorization = req.headers.authorization;
        const accessTokenFromClient = authorization
            ? authorization.split(' ')[1]
            : null;

        if (!accessTokenFromClient)
            return res.status(401).json({ message: 'Access Token missing' });

        cognitoExpress.validate(accessTokenFromClient, (err, response) => {
            if (err) return res.status(401).json({ message: err.message });

            res.locals.user = response;
            next();
        });
    } else {
        next();
    }
};

router.use('/users', validateToken, userRouter);
router.use('/channels', validateToken, channelRouter);
router.use('/clients', validateToken, clientRouter);
router.use('/campaigns', validateToken, campaigntRouter);
router.use('/notifications', validateToken, notificationRouter);

// this is a temp route to test email sending (must be deleted later)
router.use('/emails', emailRouter);

module.exports = router;
