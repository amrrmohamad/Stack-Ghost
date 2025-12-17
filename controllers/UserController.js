/**
 * @file UserController.js
 * @description Controller responsible for handling User CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import * as userService from '../utils/userService.js';


class UserController {
    /**
     * Retrieves all users from the database TO DASHBOARD ADMIN
     * (used in admin dashboard)
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */

    // (======JUST ADMIN USE IT======)
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const { users, totalUsers, totalPages } = await userService.getAllUsers(page, limit);
            res.status(200).json({
                success: true,
                count: users.length,
                total: totalUsers,
                totalPages,
                currentPage: page,
                data: users
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * update state of user in DASHBOARD
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    //(======JUST ADMIN USE IT======)
    async updateUserState(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'isActive must be boolean'
                });
            }
            await userService.updateUserState(userId, isActive);
            res.json({
                success: true,
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (err) {
            if (err.message === 'User not found') {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
      * Authenticated user: get his own data
      * RETURN all data for logged in user (current user) (used in profile page)
      */
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.user_id;
            const user = await userService.getCurrentUser(userId);
            res.json({ success: true, data: user });
        } catch (err) {
            if (err.message === 'User not found') {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    /**
     * Public user profile
     * RETURN information about another users (used in following page)
     */
    async getUserProfile(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await userService.getUserById(userId);
            res.json({ success: true, data: user });
        } catch (err) {
            if (err.message === 'User not found') {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Owner: update profile info
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.user_id;
            const { username, bio, profile_image } = req.body;
            const updated = await userService.updateProfile(userId, { username, bio, profile_image });
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user_id: updated.user_id,
                    username: updated.username,
                    bio: updated.bio,
                    profile_image: updated.profile_image
                }
            });
        } catch (err) {
            if (err.message === 'Username already taken') {
                return res.status(409).json({ success: false, message: 'Username already taken' });
            }
            if (err.message === 'User not found') {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}
export default new UserController();