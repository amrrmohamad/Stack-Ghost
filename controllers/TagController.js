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
            const tags = await prisma.tags.findMany();
            
            res.status(200).json({
                success: true,
                count: tags.length,
                data: tags
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new TagController();