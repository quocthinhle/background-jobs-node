const express = require('express');
const nodemailer = require('nodemailer');
const { send } = require('process');
const app = express();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.password,
    },
});

const sendEmail = (req, callback) => {
    const email = {
        from: process.env.DEV_EMAIL,
        to: req.body.user_email,
        subject: decodeURI(process.env.EMAIL_TEMPLATE),
        text: decodeURI(process.env.TEXT),
    };
    transporter.sendMail(email, (err, info) => {
        if (typeof callback === 'function') {
            callback(err, email);
        }
    });
}

app.post('/users', async (req, res) => {
    const user = await createUser(req);
    sendEmail(req); // Ignoring callback :D
    return res.status(200).json(user);
})


/*** Pros
 * - Crazy fast API, immediately response to client.
 */


/*** Cons
 * - Not sure that email will be sent. (Not talking about handle promise in this concept)
 * - No callback, no data captured.
 * - I guess you could log errors :D
 */
