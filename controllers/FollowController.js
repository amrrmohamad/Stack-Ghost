/**
 * @file FollowController.js
 * @description Controller for handling User Follow/Unfollow relationships.
 * @author M-Ahmd
 * @version 1.1.0
 * @date 2025-12-17
 */

import * as followService from '../utils/followService.js';
import { ERRORS } from '../lib/errors.js';

class FollowController {

    /**
     * Toggle Follow status (Follow if not following, Unfollow if already following)
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async toggleFollow(req, res) {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.user_id; // Get from JWT token, not body

            const targetUserId = parseInt(id);

            if (!currentUserId) {
                return res.status(401).json({ success: false, message: ERRORS.UNAUTHORIZED });
            }

            if (isNaN(targetUserId)) {
                return res.status(400).json({ success: false, message: ERRORS.INVALID_ID });
            }

            if (targetUserId === currentUserId) {
                return res.status(400).json({ success: false, message: ERRORS.CANNOT_FOLLOW_SELF });
            }

            const result = await followService.toggleFollowUser(targetUserId, currentUserId);

            res.status(200).json({
                success: true,
                message: result.message,
                status: result.status
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Get list of users FOLLOWING a specific user
     */
    async getFollowers(req, res) {
        try {
            const { id } = req.params;
            const userId = parseInt(id);

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const { followers, totalFollowers, totalPages } = await followService.getFollowers(userId, page, limit);

            res.status(200).json({
                success: true,
                count: followers.length, 
                total: totalFollowers,            
                totalPages: totalPages,
                currentPage: page,
                data: followers
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get list of users a specific user is FOLLOWING with Pagination
     */
    async getFollowing(req, res) {
        try {
            const { id } = req.params;
            const userId = parseInt(id);

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const { following, totalFollowing, totalPages } = await followService.getFollowing(userId, page, limit);

            res.status(200).json({
                success: true,
                count: following.length,
                total: totalFollowing,
                totalPages: totalPages,
                currentPage: page,
                data: following
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Toggle Follow Tag (Follow if not following, Unfollow if already following)
     */
    async toggleTagFollow(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.user_id; // Get from JWT token, not body

            const tagId = parseInt(id);

            if (!userId) {
                return res.status(401).json({ success: false, message: ERRORS.UNAUTHORIZED });
            }

            if (isNaN(tagId)) {
                return res.status(400).json({ success: false, message: ERRORS.INVALID_ID });
            }

            const result = await followService.toggleTagFollow(tagId, userId);

            res.status(200).json({
                success: true,
                message: result.message,
                status: result.status
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get all tags followed by a specific user with Pagination
     */
    async getFollowedTags(req, res) {
        try {
            const { id } = req.params;
            const userId = parseInt(id);

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const { tags, totalFollowedTags, totalPages } = await followService.getFollowedTags(userId, page, limit);

            res.status(200).json({
                success: true,
                count: tags.length,        
                total: totalFollowedTags,           
                totalPages: totalPages,
                currentPage: page,
                data: tags
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

}

export default new FollowController();