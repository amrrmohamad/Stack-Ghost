/**
 * @file TagController.js
 * @description Controller responsible for handling Tag CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class TagController {

    /**
     * Create a new Tag (e.g., "javascript")
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async createTag(req, res) {
        try {
            const { tag_name, description } = req.body;

            // Validation Layer
            if (!tag_name) {
                return res.status(400).json({
                    success: false,
                    message: "Tag name is required"
                });
            }

            const newTag = await prisma.tags.create({
                data: {
                    tag_name,
                    description
                }
            });

            res.status(201).json({
                success: true,
                message: "Tag created successfully",
                data: newTag
            });

        } catch (error) {
            console.error(error);
            // التعامل مع تكرار الاسم
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: "Tag already exists" });
            }
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Get all Tags
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async getAllTags(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20; 
            const skip = (page - 1) * limit;

            const { q } = req.query;
            const whereClause = q ? { tag_name: { contains: q } } : {};

            const totalTags = await prisma.tags.count({ where: whereClause });

            const tags = await prisma.tags.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                orderBy: {
                    tag_name: 'asc' 
                },
                include: {
                    _count: {
                        select: { Question_Tags: true } 
                    }
                }
            });

            const formattedTags = tags.map(tag => ({
                tag_id: tag.tag_id,
                tag_name: tag.tag_name,
                description: tag.description,
                created_at: tag.created_at,
                questions_count: tag._count.Question_Tags 
            }));

            res.status(200).json({
                success: true,
                count: formattedTags.length,
                total: totalTags,
                totalPages: Math.ceil(totalTags / limit),
                currentPage: page,
                data: formattedTags
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new TagController();