/**
 * @file FollowController.js
 * @description Controller for handling User Follow/Unfollow relationships.
 * @author M-Ahmd
 */

import * as followService from '../utils/followService.js';

class FollowController {

    /**
     * Toggle Follow status (Follow if not following, Unfollow if already following)
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async toggleFollow(req, res) {
        try {
            const { id } = req.params;
            const { current_user_id } = req.body;

            const targetUserId = parseInt(id);
            const currentUserId = parseInt(current_user_id);

            if (isNaN(targetUserId) || isNaN(currentUserId)) {
                return res.status(400).json({ success: false, message: "Invalid IDs" });
            }

            if (targetUserId === currentUserId) {
                return res.status(400).json({ success: false, message: "You cannot follow yourself" });
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
            const { user_id } = req.body; 

            const tagId = parseInt(id);
            const userId = parseInt(user_id);

            if (isNaN(tagId) || isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid IDs" });
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