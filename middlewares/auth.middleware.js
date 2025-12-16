import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Auth middleware
 * JWT and is_active
 */
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await prisma.users.findUnique({
                where: { user_id: decoded.user_id },
                include: { Roles: true }
            });

        if (!user) return res.status(401).json({ success: false, message: 'User not found' });
        if (!user.is_active) return res.status(403).json({ success: false, message: 'User is deactivated' });

        req.user = user;
        next();

    } catch (err) {
        console.error(err);
        res.status(401).json({ success: false, message: 'Unauthorized or expired token' });
    }
};

export default auth;
