import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

class AuthController {

    /**
     * sing up
     * create a new user account
     */
    async register(req, res) {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'username, email and password are required'
                });
            }

            if (password.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 10 characters'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await prisma.users.create({
                data: {
                    username,
                    email,
                    password_hash: hashedPassword,
                    is_active: true,
                    role_id: 3,
                },
                select: {
                    user_id: true,
                    username: true,
                    email: true,
                    role_id: true
                }
            });

            res.status(201).json({
                success: true,
                message: 'user signed successfully',
                data: newUser
            });

        } catch (err) {
            console.error(err);
            if (err.code === 'P2002') {
                return res.status(409).json({ success: false, message: 'username or email already exists' });
            }
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * log in
     * Authenticate user and return token
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'email and password required' });
            }

            const user = await prisma.users.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            if (!user.is_active) {
                return res.status(403).json({ success: false, message: 'User is deactivated connect with admin :(' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            //funciton to create token
            const accessToken = jwt.sign(
                { user_id: user.user_id },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { user_id: user.user_id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken
                }
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * refresh token
     *  new access token using refresh token
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

            const user = await prisma.users.findFirst({ where: { refresh_token: refreshToken } });
            if (!user) return res.status(403).json({ success: false, message: 'Invalid refresh token' });

            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            const newAccessToken = jwt.sign(
                { user_id: decoded.user_id },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.json({ success: true, accessToken: newAccessToken });

        } catch (err) {
            console.error(err);
            res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
        }
    }

    /**
     * log out
     * invalidate refresh token
     */
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

            const user = await prisma.users.findFirst({ where: { refresh_token: refreshToken } });
            if (!user) return res.status(403).json({ success: false, message: 'Invalid token' });

            // Remove refresh token
            await prisma.users.update({
                where: { user_id: user.user_id },
                data: { refresh_token: null }
            });

            res.json({ success: true, message: 'Logged out successfully' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

export default new AuthController();
