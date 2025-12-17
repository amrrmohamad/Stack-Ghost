/**
 * @file requestLogger.js
 * @description HTTP request logging middleware
 */

import logger from '../lib/logger.js';

export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.user_id
    });
    
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        
        logger[logLevel]('Request completed', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.user_id,
            ip: req.ip
        });
    });
    
    next();
};

export default requestLogger;
