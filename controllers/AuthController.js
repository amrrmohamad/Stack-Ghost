/**
 * @file AuthController.js
 * @description Controller responsible for handling Authentication operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.1.0
 * @date 2025-12-20
 */

import * as authService from '../utils/authService.js';
import { ERRORS } from '../lib/errors.js';

class AuthController {

    /**
     * Sign up - create a new user account
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async register(req, res) {
        try {
            const { username, email, password } = req.body;

            const newUser = await authService.registerUser(username, email, password);

            res.status(201).json({
                success: true,
                message: 'User signed up successfully',
                data: newUser
            });

        } catch (err) {
            console.error(err);

            if (err.message.includes('required')) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (err.message.includes('at least')) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (err.message.includes('already exists')) {
                return res.status(409).json({ success: false, message: err.message });
            }

            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Log in - Authenticate user and return tokens
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const { accessToken, refreshToken } = await authService.loginUser(email, password);

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

            if (err.message.includes('required')) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (err.message.includes('Invalid credentials')) {
                return res.status(401).json({ success: false, message: err.message });
            }
            if (err.message.includes('deactivated')) {
                return res.status(403).json({ success: false, message: 'User is deactivated, contact admin :(' });
            }

            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Refresh token - Generate new access token using refresh token
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({ success: false, message: ERRORS.UNAUTHORIZED });
            }

            const tokens = await authService.refreshUserToken(refreshToken);

            res.json({
                success: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });

        } catch (err) {
            console.error(err);

            if (err.message.includes('Invalid refresh token')) {
                return res.status(403).json({ success: false, message: err.message });
            }
            if (err.message.includes('deactivated')) {
                return res.status(403).json({ success: false, message: ERRORS.USER_DEACTIVATED });
            }

            res.status(403).json({ success: false, message: ERRORS.TOKEN_EXPIRED });
        }
    }

    /**
     * Log out - Invalidate refresh token
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ success: false, message: 'Refresh token required' });
            }

            await authService.logoutUser(refreshToken);

            res.json({ success: true, message: 'Logged out successfully' });

        } catch (err) {
            console.error(err);

            if (err.message.includes('Invalid token')) {
                return res.status(403).json({ success: false, message: err.message });
            }

            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

export default new AuthController();
