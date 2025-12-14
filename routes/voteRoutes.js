/**
 * @file voteRoutes.js
 * @description voteRoutes responsible for handling vote CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-13
 */


import VoteController from "../controllers/VoteController.js";


import express from 'express';

const router = express.Router();

router.post('/', VoteController.handleVote);
router.get('/status', VoteController.checkVoteStatus);
router.get('/:user_id/votes', VoteController.getUserVotesHistory);

export default router;