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

    // Get all users (accessible to all authenticated users)
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100; // Allow fetching more users
            const userRole = req.user?.Roles?.role_name;
            const isAdmin = userRole === 'admin' || userRole === 'moderator';
            
            // Get current user ID to exclude from results and check follow status
            const currentUserId = req.user?.user_id || null;
            
            const { users, totalUsers, totalPages } = await userService.getAllUsers(page, limit, isAdmin, currentUserId, currentUserId);
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
     * Get complete user profile with badges, questions, answers, tags
     */
    async getCompleteProfile(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { include } = req.query;
            const includes = include ? include.split(',') : ['badges', 'questions', 'answers', 'tags', 'stats'];

            const profileData = {
                user: await userService.getUserById(userId)
            };

            // Import profile service
            const profileService = await import('../utils/profileService.js');

            if (includes.includes('badges')) {
                profileData.badges = await profileService.getUserBadges(userId);
            }

            if (includes.includes('questions')) {
                const questionsData = await profileService.getUserQuestions(userId, 1, 50);
                profileData.questions = questionsData.questions;
                profileData.totalQuestions = questionsData.total;
            }

            if (includes.includes('answers')) {
                const answersData = await profileService.getUserAnswers(userId, 1, 50);
                profileData.answers = answersData.answers;
                profileData.totalAnswers = answersData.total;
            }

            if (includes.includes('tags')) {
                profileData.followedTags = await profileService.getUserFollowedTags(userId);
            }

            if (includes.includes('stats')) {
                const followService = await import('../utils/followService.js');
                profileData.followStats = await followService.getFollowStats(userId);
            }

            if (includes.includes('titles')) {
                profileData.questionTitles = await profileService.getUserQuestionTitles(userId, 10);
            }

            res.json({ success: true, data: profileData });
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