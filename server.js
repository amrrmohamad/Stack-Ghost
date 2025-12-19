/**
 * @file server.js
 * @description server is the main file of the project
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-17
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './lib/prisma.js';
import logger from './lib/logger.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import answerRoutes from './routes/answerRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import authRoutes from './routes/authRoutes.js';
import followRoutes from './routes/followRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const PORT = process.env.PORT || 3000;
const app = express();

// CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5500', // Adjust this to your frontend URL
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve landing page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend_stack_ghost', 'landing_page', 'index.html'));
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend_stack_ghost')));

// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
}

// Rate limiting for all API routes
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: 'connected',
            uptime: process.uptime()
        });
    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({ 
            status: 'error', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', followRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { 
        error: err.message, 
        stack: err.stack,
        url: req.url,
        method: req.method
    });
    
    res.status(err.statusCode || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing HTTP server');
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    logger.info(`🚀 Server is running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});