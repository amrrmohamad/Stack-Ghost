/**
 * @file server.js
 * @description server is the main file of the project
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js'
import answerRoutes from './routes/answerRoutes.js'
import tagRoutes from './routes/tagRoutes.js'
import commentRoutes from './routes/commentRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import authRoutes from './routes/authRoutes.js';
const PORT = 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/users', userRoutes); 
// route for authcontroller
app.use('/api/auth', authRoutes);

app.use('/api/questions', questionRoutes); 

app.use('/api/answers', answerRoutes);

app.use('/api/tags', tagRoutes);

app.use('/api/comments', commentRoutes);

app.use('/api/votes', voteRoutes);
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});