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
import questionRoutes from './routes/questionRoutes.js'

const PORT = 3000;

const app = express();

app.use(express.json());


app.use('/api', userRoutes); 

app.use('/api', questionRoutes);


app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});