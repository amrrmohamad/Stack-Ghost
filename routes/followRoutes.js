import express from 'express';
import FollowController from '../controllers/FollowController.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Authenticated: toggle follow (more specific routes first)
router.post('/tags/:id/toggle', auth, FollowController.toggleTagFollow);
router.post('/:id/toggle', auth, FollowController.toggleFollow);

// Public: view followers/following
router.get('/:id/followers', FollowController.getFollowers);
router.get('/:id/following', FollowController.getFollowing);
router.get('/:id/tags', FollowController.getFollowedTags);

export default router;