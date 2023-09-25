const express = require('express');
const router = express.Router();
const { send } = require('../utils/email');

/**
 * this is a temp route to test email sending (must be deleted later)
 * uses send function from src/utils/email.js
 */
router.post('/send', (req, res) => {
    const { to, subject, message } = req.body;

    send({ to, subject, message })
        .then(resp => {
            console.log(resp);
            return res.status(200).json({ message: 'Email sent' });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({ message: err.message });
        });
});

module.exports = router;
