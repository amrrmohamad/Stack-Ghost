/**
 * @file AnswerController.js
 * @description Controller responsible for handling Answer CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */

import { PrismaClient } from "@prisma/client";
import { awardBadge } from '../utils/badgeService.js';

const prisma = new PrismaClient();

class AnswerController {
    /**
     * Create a new answer
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async createAnswer(req, res) {
        try {
            const { body, question_id, user_id } = req.body;

            if (!body || !question_id || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Body, Question ID, and User ID are required"
                });
            }

            const newAnswer = await prisma.answers.create({
                data: {
                    body,
                    question_id: parseInt(question_id),
                    user_id: parseInt(user_id)
                }
            });

            try {
                const answerCount = await prisma.answers.count({
                    where: { user_id: parseInt(user_id) }
                });

                if (answerCount === 1) {
                    await awardBadge(parseInt(user_id), 'Teacher');
                }
            } catch (badgeError) {
                console.error("Badge System Error:", badgeError);
            }

            res.status(201).json({
                success: true,
                message: "Answer added successfully 🚀",
                data: newAnswer
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * get all answers and users who answer it
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async getQuestionAnswers(req, res) {
        try {
            const { questionId } = req.params;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const totalAnswers = await prisma.answers.count({
                where: { question_id: parseInt(questionId) }
            });

            const answersData = await prisma.answers.findMany({
                where: {
                    question_id: parseInt(questionId)
                },
                skip: skip,
                take: limit,
                include: {
                    Users: {
                        select: { username: true, reputation: true, profile_image: true }
                    },
                    Votes: true,
                    Comments: {
                        include: {
                            Users: {
                                select: { username: true, profile_image: true }
                            }
                        },
                        orderBy: {
                            created_at: 'asc'
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            const answersWithCounts = answersData.map(answer => {
                const voteCount = answer.Votes.reduce((acc, vote) => {
                    return acc + (vote.value || vote.vote_type || 0);
                }, 0);

                return {
                    ...answer,
                    vote_count: voteCount,
                    Votes: undefined
                };
            });

            res.status(200).json({
                success: true,
                count: answersWithCounts.length,
                total: totalAnswers,
                totalPages: Math.ceil(totalAnswers / limit),
                currentPage: page,
                data: answersWithCounts
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * Accept Answer (Simplified Version - No Token)
     * Expects: user_id (of the requester), question_id, answer_id in body
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async acceptAnswer(req, res) {
        try {
            const { user_id, answer_id } = req.body;

            if (!user_id || !answer_id) {
                return res.status(400).json({ success: false, message: "Missing user_id or answer_id" });
            }

            const answerToAccept = await prisma.answers.findUnique({
                where: { answer_id: parseInt(answer_id) },
                include: { Questions: true }
            });

            if (!answerToAccept) {
                return res.status(404).json({ success: false, message: "Answer not found" });
            }

            const questionId = answerToAccept.question_id;
            const questionOwnerId = answerToAccept.Questions.user_id;

            if (questionOwnerId !== parseInt(user_id)) {
                return res.status(403).json({ success: false, message: "Only the question owner can accept an answer." });
            }

            if (answerToAccept.is_accepted) {
                return res.status(400).json({ success: false, message: "This answer is already accepted." });
            }

            const oldAcceptedAnswer = await prisma.answers.findFirst({
                where: {
                    question_id: questionId,
                    is_accepted: true
                }
            });

            const transactionOps = [];

            if (oldAcceptedAnswer) {
                transactionOps.push(
                    prisma.answers.update({
                        where: { answer_id: oldAcceptedAnswer.answer_id },
                        data: { is_accepted: false }
                    }),
                    prisma.users.update({
                        where: { user_id: oldAcceptedAnswer.user_id },
                        data: { reputation: { decrement: 15 } }
                    })
                );
            }

            transactionOps.push(
                prisma.answers.update({
                    where: { answer_id: parseInt(answer_id) },
                    data: { is_accepted: true }
                }),
                prisma.users.update({
                    where: { user_id: answerToAccept.user_id },
                    data: { reputation: { increment: 15 } }
                })
            );

            await prisma.$transaction(transactionOps);

            res.status(200).json({ success: true, message: "Answer accepted, reputation adjusted (switched if needed)." });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * updateAnswer - is update answer by id
     * @param {req} request 
     * @param {res} response
     * @returns void
     */
    async updateAnswer(req, res) {
        try {
            const { id } = req.params;
            const { body, user_id } = req.body;
            const answerId = parseInt(id);

            if (isNaN(answerId)) {
                return res.status(400).json({ success: false, message: "Invalid Answer ID" });
            }

            if (!body || !user_id) {
                return res.status(400).json({ success: false, message: "Body and user_id are required" });
            }

            const oldAnswer = await prisma.answers.findUnique({
                where: { answer_id: answerId }
            });

            if (!oldAnswer) {
                return res.status(404).json({ success: false, message: "Answer not found" });
            }

            const userExists = await prisma.users.findUnique({
                where: { user_id: parseInt(user_id) }
            });

            if (!userExists) {
                return res.status(404).json({ success: false, message: "User performing the edit does not exist" });
            }

            const result = await prisma.$transaction(async (prisma) => {

                await prisma.edit_History.create({
                    data: {
                        answer_id: answerId,
                        user_id: parseInt(user_id),
                        old_body: oldAnswer.body,
                        new_body: body,
                        created_at: new Date()
                    }
                });

                const updated = await prisma.answers.update({
                    where: { answer_id: answerId },
                    data: {
                        body: body,
                        updated_at: new Date()
                    }
                });

                return updated;
            });

            res.status(200).json({
                success: true,
                message: "Answer updated and history saved",
                data: result
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    /**
     * deleteAnswer - is delete answer by id
     * @req : request
     * @res : response
     * returns
     */
    async deleteAnswer(req, res) {
        try {
            const { id } = req.params;
            const answerId = parseInt(id);

            if (isNaN(answerId)) {
                return res.status(400).json({ success: false, message: "Invalid Answer ID" });
            }

            await prisma.answers.delete({
                where: { answer_id: answerId }
            });

            res.status(200).json({
                success: true,
                message: "Answer deleted successfully"
            });

        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: "Answer not found" });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

}

export default new AnswerController();