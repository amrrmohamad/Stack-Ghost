import express from 'express';
import FollowController from '../controllers/FollowController.js';

const router = express.Router();

router.post('/:id/toggle', FollowController.toggleFollow);

router.get('/:id/followers', FollowController.getFollowers);

router.get('/:id/following', FollowController.getFollowing);

router.post('/tags/:id/toggle', FollowController.toggleTagFollow);
router.get('/:id/tags', FollowController.getFollowedTags);


// URL: /api/users/tags/5/toggle 
// Body: { "user_id": 1 }
router.post('/tags/:id/toggle', FollowController.toggleTagFollow);

// URL: /api/users/1/tags 
router.get('/:id/tags', FollowController.getFollowedTags);
export default router;