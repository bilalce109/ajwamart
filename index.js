import express from "express";
import dotenv from 'dotenv';
import mongoose from "mongoose";
import upload from 'express-fileupload';
import http from "http";
import roleRoute from './routes/role.js';
import users from './routes/users.js';
import admin from './routes/admin.js';
import privilege from './routes/privilege.js';
import employees from './routes/employees.js';
import service from './routes/service.js';
import job from './routes/job.js';
import coupon from './routes/coupon.js';
import vendor from "./routes/vendor.js";
import attendance from "./routes/attendance.js";
import cors from 'cors';
import cashDrawer from "./routes/cashDrawer.js";
import inventory from "./routes/inventory.js";
import discount from "./routes/discount.js";
import invoice from "./routes/invoice.js";
import reports from "./routes/reports.js";
import { Server } from 'socket.io';

import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(upload());
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'));
app.use(express.static('liqteq'));


app.use("/api/roles", roleRoute);
app.use("/api/users", users);
app.use("/api/admin", admin);
app.use("/api/privilege", privilege);
app.use("/api/employees", employees);
app.use("/api/service", service);
app.use("/api/job", job);
app.use("/api/coupon", coupon);
app.use("/api/vendor", vendor);
app.use("/api/attendance", attendance);
app.use("/api/cashDrawer", cashDrawer);
app.use("/api/inventory", inventory);
app.use("/api/discount", discount);
app.use("/api/invoice", invoice);
app.use("/api/reports", reports);



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

var PORT = process.env.PORT,
    DB_URL = process.env.DB_URL

mongoose.connect(DB_URL, (err, db) => {
    if (err) console.error(err);
    console.log('Database Connected!');
});

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'liqteq', 'index.html'));
});

// app.get("/", (req, res) => res.send("Welcome to the Users API!!!"));

app.post('/testing', (req, res) => {
    console.log(req.body);
    return;
})

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
    // Listen for the 'jobCreated' event
    socket.on('jobCreated', (newJob) => {
        console.log('New job created:', newJob);
    });
    socket.on('serviceAdded', (newService) => {
        console.log('New service created:', newService);
    });
});

// Export the `io` instance using a named export
export { io };

// For Admin Panel UI


server.listen(PORT, () => console.log(`Server running on port: http://localhost:3000`));