import express from 'express';
import FollowController from '../controllers/FollowController.js';

const router = express.Router();

router.post('/:id/toggle', FollowController.toggleFollow);

router.get('/:id/followers', FollowController.getFollowers);

router.get('/:id/following', FollowController.getFollowing);

export default router;