const nodemailer = require('nodemailer');

const config = {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
};

const send = ({ to, subject, message }) => {
    return new Promise((resolve, reject) => {
        if (!to || !subject || !message) {
            return reject(
                new Error('Missing to, subject or message for email')
            );
        }

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: config.EMAIL_HOST,
            port: config.EMAIL_PORT,
            secure: true,
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS,
            },
        });

        const emailOption = {
            from: config.EMAIL_USER,
            to: to,
            subject: subject,
            text: message,
        };

        try {
            transporter.verify(function (error, success) {
                if (error) {
                    return reject(err);
                } else {
                    transporter.sendMail(emailOption, (err, info) => {
                        if (!err) {
                            return resolve(info);
                        } else {
                            return reject(err);
                        }
                    });
                }
            });
        } catch (err) {
            return reject(err);
        }
    });
};

module.exports = {
    send,
};
