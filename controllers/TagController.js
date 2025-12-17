/**
 * @file TagController.js
 * @description Controller responsible for handling Tag CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import * as tagService from '../utils/tagService.js';

class TagController {

    async createTag(req, res) {
        try {
            const { tag_name, description } = req.body;

            if (!tag_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Tag name is required'
                });
            }

            const tag = await tagService.createTag(tag_name, description);

            res.status(201).json({
                success: true,
                data: tag
            });

        } catch (error) {
            if (error.message.includes('exists')) {
                return res.status(409).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async getAllTags(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const q = req.query.q || '';

            const result = await tagService.getAllTags(page, limit, q);

            res.status(200).json({
                success: true,
                ...result,
                currentPage: page
            });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateTag(req, res) {
        try {
            const tagId = parseInt(req.params.id);
            const { tag_name, description } = req.body;

            if (isNaN(tagId)) {
                return res.status(400).json({ success: false, message: 'Invalid tag id' });
            }

            const updated = await tagService.updateTag(tagId, tag_name, description);

            res.status(200).json({
                success: true,
                data: updated
            });

        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes('exists')) {
                return res.status(409).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async deleteTag(req, res) {
        try {
            const tagId = parseInt(req.params.id);

            if (isNaN(tagId)) {
                return res.status(400).json({ success: false, message: 'Invalid tag id' });
            }

            await tagService.deleteTag(tagId);

            res.status(200).json({
                success: true,
                message: 'Tag deleted successfully'
            });

        } catch (error) {
            if (error.message.includes('associated')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

export default new TagController();
