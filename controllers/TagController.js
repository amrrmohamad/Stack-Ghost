/**
 * @file TagController.js
 * @description Controller responsible for handling Tag CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import * as tagService from '../utils/tagService.js';

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

            const newTag = await tagService.createTag(tag_name, description);

            res.status(201).json({
                success: true,
                message: "Tag created successfully",
                data: newTag
            });

        } catch (error) {
            console.error(error);
            if (error.message.includes("already exists")) {
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
            const { q } = req.query;

            const { tags, totalTags, totalPages } = await tagService.getAllTags(page, limit, q);

            res.status(200).json({
                success: true,
                count: tags.length,
                total: totalTags,
                totalPages: totalPages,
                currentPage: page,
                data: tags
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Update Tag details
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async updateTag(req, res) {
        try {
            const { id } = req.params;
            const { tag_name, description } = req.body;
            const tagId = parseInt(id);

            if (isNaN(tagId)) {
                return res.status(400).json({ success: false, message: "Invalid Tag ID" });
            }

            const updatedTag = await tagService.updateTag(tagId, tag_name, description);

            res.status(200).json({
                success: true,
                message: "Tag updated successfully",
                data: updatedTag
            });

        } catch (error) {
            if (error.message.includes("already exists")) {
                return res.status(409).json({ success: false, message: "Tag name already exists" });
            }
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: "Tag not found" });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * Delete a Tag
     * @param {import('express').Request} req 
     * @param {import('express').Response} res
     */
    async deleteTag(req, res) {
        try {
            const { id } = req.params;
            const tagId = parseInt(id);

            if (isNaN(tagId)) {
                return res.status(400).json({ success: false, message: "Invalid Tag ID" });
            }

            await tagService.deleteTag(tagId);

            res.status(200).json({
                success: true,
                message: "Tag deleted successfully"
            });

        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: "Tag not found" });
            }
            if (error.message.includes("associated")) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Cannot delete this tag because it is associated with questions. Please remove associations first." 
                });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new TagController();