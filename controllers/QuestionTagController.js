import * as questionTagService from '../utils/questionTagService.js';

class QuestionTagController {

    /**
     * Add tags to a question
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async addTags(req, res) {
        try {
            const questionId = parseInt(req.params.questionId);
            const { tagIds } = req.body;
            const userId = req.user?.user_id;
            const userRole = req.user?.Roles?.role_name;
            const isModerator = userRole === 'moderator' || userRole === 'admin';

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            if (isNaN(questionId)) {
                return res.status(400).json({ success: false, message: 'Invalid question ID' });
            }

            if (!Array.isArray(tagIds) || tagIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'tagIds must be a non-empty array'
                });
            }

            await questionTagService.addTagsToQuestion(questionId, tagIds, userId, isModerator);

            res.status(200).json({
                success: true,
                message: 'Tags added successfully'
            });

        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes('Unauthorized') || error.message.includes('Not allowed')) {
                return res.status(403).json({ success: false, message: error.message });
            }
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Update tags for a question
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async updateTags(req, res) {
        try {
            const questionId = parseInt(req.params.questionId);
            const { tagIds } = req.body;
            const userId = req.user?.user_id;
            const userRole = req.user?.Roles?.role_name;
            const isModerator = userRole === 'moderator' || userRole === 'admin';

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            if (isNaN(questionId)) {
                return res.status(400).json({ success: false, message: 'Invalid question ID' });
            }

            if (!Array.isArray(tagIds)) {
                return res.status(400).json({ success: false, message: 'tagIds must be array' });
            }

            await questionTagService.replaceQuestionTags(questionId, tagIds, userId, isModerator);

            res.status(200).json({
                success: true,
                message: 'Tags updated successfully'
            });

        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes('Unauthorized') || error.message.includes('Not allowed')) {
                return res.status(403).json({ success: false, message: error.message });
            }
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Remove a tag from a question
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async removeTag(req, res) {
        try {
            const questionId = parseInt(req.params.questionId);
            const tagId = parseInt(req.params.tagId);
            const userId = req.user?.user_id;
            const userRole = req.user?.Roles?.role_name;
            const isModerator = userRole === 'moderator' || userRole === 'admin';

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            if (isNaN(questionId) || isNaN(tagId)) {
                return res.status(400).json({ success: false, message: 'Invalid question ID or tag ID' });
            }

            await questionTagService.removeTagFromQuestion(questionId, tagId, userId, isModerator);

            res.status(200).json({
                success: true,
                message: 'Tag removed successfully'
            });

        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes('Unauthorized') || error.message.includes('Not allowed')) {
                return res.status(403).json({ success: false, message: error.message });
            }
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new QuestionTagController();