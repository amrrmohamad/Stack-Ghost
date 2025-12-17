import express from 'express';
import QuestionTagController from '../controllers/QuestionTagController.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Add tags to a question (owner or moderator)
router.post('/:questionId/tags', auth, QuestionTagController.addTags);

// Replace all tags for a question (owner or moderator)
router.put('/:questionId/tags', auth, QuestionTagController.updateTags);

// Remove a tag from a question (owner or moderator)
router.delete('/:questionId/tags/:tagId', auth, QuestionTagController.removeTag);

export default router;
