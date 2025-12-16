/**
 * @file FollowController.js
 * @description Controller for handling User Follow/Unfollow relationships.
 * @author M-Ahmd
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

            const existingFollow = await prisma.follow_Users.findUnique({
                where: {
                    user_id_followed_user_id: {
                        user_id: currentUserId,
                        followed_user_id: targetUserId
                    }
                }
            });

            if (existingFollow) {
                await prisma.follow_Users.delete({
                    where: {
                        user_id_followed_user_id: {
                            user_id: currentUserId,
                            followed_user_id: targetUserId
                        }
                    }
                });

                return res.status(200).json({
                    success: true,
                    message: "Unfollowed successfully",
                    status: "unfollowed"
                });

            } else {
                await prisma.follow_Users.create({
                    data: {
                        user_id: currentUserId,
                        followed_user_id: targetUserId,
                        created_at: new Date()
                    }
                });

                return res.status(200).json({
                    success: true,
                    message: "Followed successfully",
                    status: "followed"
                });
            }

        } catch (error) {
            console.error(error);
            if (error.code === 'P2003') {
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
            const skip = (page - 1) * limit;

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const totalFollowers = await prisma.follow_Users.count({
                where: { followed_user_id: userId }
            });

            const followers = await prisma.follow_Users.findMany({
                where: { followed_user_id: userId },
                skip: skip,    
                take: limit, 
                include: {
                    Follower: {
                        select: { user_id: true, username: true, profile_image: true, reputation: true }
                    }
                }
            });

            const formattedFollowers = followers.map(f => f.Follower);

            res.status(200).json({
                success: true,
                count: formattedFollowers.length, 
                total: totalFollowers,            
                totalPages: Math.ceil(totalFollowers / limit),
                currentPage: page,
                data: formattedFollowers
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
            const skip = (page - 1) * limit;

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const totalFollowing = await prisma.follow_Users.count({
                where: { user_id: userId }
            });

            const following = await prisma.follow_Users.findMany({
                where: { user_id: userId },
                skip: skip,
                take: limit,
                include: {
                    Followed: {
                        select: { user_id: true, username: true, profile_image: true, reputation: true }
                    }
                }
            });

            const formattedFollowing = following.map(f => f.Followed);

            res.status(200).json({
                success: true,
                count: formattedFollowing.length,
                total: totalFollowing,
                totalPages: Math.ceil(totalFollowing / limit),
                currentPage: page,
                data: formattedFollowing
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

            const tagExists = await prisma.tags.findUnique({ where: { tag_id: tagId } });
            if (!tagExists) {
                return res.status(404).json({ success: false, message: "Tag not found" });
            }

            const existingFollow = await prisma.follow_Tags.findUnique({
                where: {
                    user_id_tag_id: { // Prisma Composite Key
                        user_id: userId,
                        tag_id: tagId
                    }
                }
            });

            if (existingFollow) {
                await prisma.follow_Tags.delete({
                    where: {
                        user_id_tag_id: {
                            user_id: userId,
                            tag_id: tagId
                        }
                    }
                });

                return res.status(200).json({
                    success: true,
                    message: "Tag unfollowed successfully",
                    status: "unfollowed"
                });

            } else {
                await prisma.follow_Tags.create({
                    data: {
                        user_id: userId,
                        tag_id: tagId,
                        created_at: new Date()
                    }
                });

                return res.status(200).json({
                    success: true,
                    message: "Tag followed successfully",
                    status: "followed"
                });
            }

        } catch (error) {
            console.error(error);
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
            const skip = (page - 1) * limit;

            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const totalFollowedTags = await prisma.follow_Tags.count({
                where: { user_id: userId }
            });

            const followedTags = await prisma.follow_Tags.findMany({
                where: { user_id: userId },
                skip: skip,     
                take: limit,    
                include: {
                    Tags: true 
                }
            });

            const formattedTags = followedTags.map(ft => ft.Tags);

            res.status(200).json({
                success: true,
                count: formattedTags.length,        
                total: totalFollowedTags,           
                totalPages: Math.ceil(totalFollowedTags / limit),
                currentPage: page,
                data: formattedTags
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

}

export default new FollowController();