/**
 * @file server.js
 * @description server is the main file of the project
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */
import 'dotenv/config';
import express from 'express';
import userRoutes from './routes/userRoutes.js';

const app = express();

// عشان نفهم الـ JSON اللي جاي في الـ POST Request
app.use(express.json());

// شغل الراوتات
app.use('/api', userRoutes); 

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});