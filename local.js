const cluster = require('cluster');
const http = require('http');
const nodemailer = require('nodemailer');
const express = require('express');

const emails = [];
const children = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.password,
    },
});

const log = (p, message) => {
    let name, pid;
    if (p.name !== undefined) {
        name = p.name;
        pid = p.process.pid;
    } else {
        name = 'master';
        pid = process.pid;
    }
    console.log(`[name = ${name}, msg = ${msg}]`);
}

const doMasterStuff = () => {
    log('master', 'master started');

    const checkOnServer = () => {
        if (children.server === undefined) {
            children.server = cluster.fork({ MODE: 'server' });
            children.server.name = 'Web Server';
            children.server.on('online', () => log(childern.server, `ready on PORT: `));
            children.server.on('exit', () => {
                log(children.server, 'died :(');
                delete children.server;
            });
            children.server.on('message', (message) => {
                log(children.server, 'got an email to send from the webserver: ' + JSON.stringify(message));
                children.worker.send(message);
            });
        }
    }

    const checkOnWorker = () => {
        if (children.worker === undefined) {
            children.worker = cluster.fork({ MODE: 'worker' });
            children.worker.name = 'Worker';
            children.worker.on('online', () => { log(children.worker, 'ready!'); });
            children.worker.on('exit', () => {
                log(children.worker, 'died :(');
                delete children.worker;
            });
            children.worker.on('message', (message) => {
                log(children.worker, JSON.stringify(message));
            });
        }
    }

    const doMasterJob = () => {
        checkOnServer();
        checkOnWorker();
    }

    setInterval(doMasterJob, 1000);
}

const doServerStuff = () => {
    const app = express();
    app.post('/users', async (req, res) => {
        const user = await createUser(req);
        res.status(200).json({ user });
        process.send(email);
    });
}

const doWorkerStuff = () => {
    process.on('message', (message) => {
        emails.push(message);
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

    const workerLoop = () => {
        if (emails.length === 0) {
            setTimeout(workerLoop, 1000);
        } else {
            const email = emails.shift();
            process.send({ message: 'Email sending ...' });
            sendEmail(email, (err) => {
                if (err) {
                    emails.push(email); // Retry
                    process.send({ message: `${email.dest} failed` });
                } else {
                    process.send({ message: `${email.dest} sent successfully` });
                }
                setTimeout(workerLoop, 1000);
            });
        }
    }
    workerLoop();
}

/***
 *                    LEADER PROCESS
 *                      /         \
 *                     /           \
 *                    /             \
 *                   /               \
 *        FOLLOWER PROCESS       FOLLOWER PROCESS
 */

if (cluster.isMaster) {
    doMasterStuff();
} else {
    if (process.env.MODE == 'WORKER') doWorkerStuff();
    else if (process.env.MODE == 'SERVER') doServerStuff();
}