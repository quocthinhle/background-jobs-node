const express = require('express');
const nodemailer = require('nodemailer')
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
        callback(err, email);
    });
}

app.post('/users', async (req, res) => {
    const user = await createUser(req);
    sendEmail(req, (err, email) => {
        if (err) {
            logger.error(err);
            return res.status(500).json({ success: false });
        }
        return res.status(200).json({ success: true });
    })
});

/*** Pros
 * 
 */


/*** Cons
 * - Really slow - send email is a heavy task
 */
