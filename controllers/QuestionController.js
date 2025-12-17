/**
 * @file QuestionController.js
 * @description Controller responsible for handling Question CRUD operations.
 * @author M-Ahmd <ma0950082@gmail.com>
 * @version 1.0.0
 * @date 2025-12-11
 */
import { PrismaClient } from "@prisma/client";
import { awardBadge } from "../utils/badgeService";
const prisma = new PrismaClient();

class QuestionController {
    /**
     * Create a new question
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async createQuestion(req, res) {
        try {
            const { title, body, user_id, tag_ids } = req.body;

            if (!title || !body || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Title, Body, and User ID are required"
                });
            }

            let tagsData = {};
            if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
                tagsData = {
                    create: tag_ids.map(id => ({
                        Tags: { connect: { tag_id: parseInt(id) } }
                    }))
                };
            }

            const newQuestion = await prisma.questions.create({
                data: {
                    title,
                    body,
                    user_id: parseInt(user_id),
                    Question_Tags: tagsData
                },
                include: {
                    Question_Tags: true
                }
            });

            try {
                const questionCount = await prisma.questions.count({
                    where: { user_id: parseInt(user_id) }
                });

                if (questionCount === 1) {
                    await awardBadge(parseInt(user_id), 'Student');
                }
            } catch (badgeError) {
                console.error("Badge System Error:", badgeError);
            }

            res.status(201).json({
                success: true,
                message: "Question posted successfully 🚀",
                data: newQuestion
            });
        } catch (error) {
            console.error(error);

            if (error.code === 'P2002' && error.meta?.target?.includes('title')) {
                return res.status(409).json({
                    success: false,
                    message: "A question with this title already exists. Please choose a different title."
                });
            }

            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * updateQuestion - is a function to update a question 
     * in the system by id
     * @param {req} request
     * @param {res} response
     * @returns 
     */
    async updateQuestion(req, res) {
        try {
            const { id } = req.params;
            const { title, body, user_id } = req.body; 
            const questionId = parseInt(id);

            if (isNaN(questionId)) {
                return res.status(400).json({ success: false, message: "Invalid ID" });
            }

            const oldQuestion = await prisma.questions.findUnique({
                where: { question_id: questionId }
            });

            if (!oldQuestion) {
                return res.status(404).json({ success: false, message: "Question not found" });
            }

            const result = await prisma.$transaction(async (prisma) => {
                
                await prisma.edit_History.create({
                    data: {
                        question_id: questionId,
                        user_id: user_id, 
                        old_body: oldQuestion.body, 
                        new_body: body,             
                        created_at: new Date()
                    }
                });

                const updated = await prisma.questions.update({
                    where: { question_id: questionId },
                    data: {
                        title: title,
                        body: body,
                        updated_at: new Date()
                    }
                });

                return updated;
            });

            res.status(200).json({
                success: true,
                message: "Question updated and history saved",
                data: result
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * deleteQuestion - is a function to delete a question from system
     * @param {req} request 
     * @param {res} response
     * @returns 
     */
    async deleteQuestion(req, res) {
        try {
            const { id } = req.params;
            const questionId = parseInt(id);

            if (isNaN(questionId)) {
                return res.status(400).json({ success: false, message: "Invalid ID" });
            }

            // الحذف
            await prisma.questions.delete({
                where: { question_id: questionId }
            });

            res.status(200).json({
                success: true,
                message: "Question deleted successfully"
            });

        } catch (error) {
            // لو بتحاول تمسح حاجة مش موجودة
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: "Question not found" });
            }
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * get all questions
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    async getAllQuestions(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (limit > 50) {
                limit = 50;
            }

            const skip = (page - 1) * limit;

            const totalQuestions = await prisma.questions.count();

            const questions = await prisma.questions.findMany({
                skip: skip,
                take: limit,
                orderBy: { created_at: 'desc' },

                select: {
                    question_id: true,
                    title: true,
                    body: true,
                    views_count: true,
                    created_at: true,

                    Author: {
                        select: {
                            username: true,
                            profile_image: true,
                            reputation: true
                        }
                    },

                    Question_Tags: {
                        select: {
                            Tags: {
                                // 1. التعديل هنا: اسم العمود tag_name
                                select: { tag_name: true }
                            }
                        }
                    },

                    Votes: { select: { vote_type: true } },
                    _count: { select: { Answers: true } }
                }
            });

            const sanitizedQuestions = questions.map(q => {
                const score = q.Votes.reduce((acc, curr) => acc + (curr.vote_type || 0), 0);

                const bodySnippet = q.body.length > 150
                    ? q.body.substring(0, 150) + '...'
                    : q.body;

                // 2. والتعديل هنا كمان عشان الماب تشتغل صح
                const tags = q.Question_Tags.map(qt => qt.Tags.tag_name);

                return {
                    question_id: q.question_id,
                    title: q.title,
                    summary: bodySnippet,
                    views: q.views_count,
                    score: score,
                    answers_count: q._count.Answers,
                    created_at: q.created_at,
                    author: q.Author,
                    tags: tags
                };
            });

            res.status(200).json({
                success: true,
                count: sanitizedQuestions.length,
                total: totalQuestions,
                totalPages: Math.ceil(totalQuestions / limit),
                currentPage: page,
                data: sanitizedQuestions
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * 
     * @param {req} request parameter 
     * @param {res} response parameter 
     * @returns void
     */
    async getQuestionById(req, res) {
        try {
            const { id } = req.params;

            const cookieName = `viewed_${id}`;

            const hasViewed = req.cookies[cookieName];

            let question;

            if (hasViewed) {
                question = await prisma.questions.findUnique({
                    where: { question_id: parseInt(id) },
                    include: {
                        Author: { select: { username: true, reputation: true, profile_image: true } },
                        Question_Tags: { include: { Tags: true } },
                        Votes: { select: { vote_type: true } },
                        Comments: { include: { Users: { select: { username: true, profile_image: true } } } },
                        _count: { select: { Answers: true } }
                    }
                });
            } else {
                question = await prisma.questions.update({
                    where: { question_id: parseInt(id) },
                    data: { views_count: { increment: 1 } },
                    include: {
                        Author: { select: { username: true, reputation: true, profile_image: true } },
                        Question_Tags: { include: { Tags: true } },
                        Votes: { select: { vote_type: true } },
                        Comments: { include: { Users: { select: { username: true, profile_image: true } } } },
                        _count: { select: { Answers: true } }
                    }
                });

                res.cookie(cookieName, 'true', { maxAge: 60 * 60 * 1000, httpOnly: true });
            }

            if (!question) {
                return res.status(404).json({ success: false, message: "Question not found" });
            }

            const score = question.Votes ? question.Votes.reduce((acc, curr) => acc + (curr.vote_type || 0), 0) : 0;
            const { Votes, ...questionData } = question;

            res.status(200).json({
                success: true,
                data: { ...questionData, vote_count: score }
            });

        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    message: "Question not found"
                });
            }

            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * searchQuestions - is a function responsible for searching in 
     * the database based on the title, username or tag
     * @req : request
     * @res : response
     * returns void
     */
    async searchQuestions(req, res) {
        try {
            const { q } = req.query;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            if (!q) {
                return res.status(400).json({ success: false, message: "Search query 'q' is required" });
            }

            const whereClause = {
                OR: [
                    {
                        title: { contains: q, mode: 'insensitive' }
                    },
                    {
                        Author: {
                            username: { contains: q, mode: 'insensitive' }
                        }
                    },
                    {
                        Question_Tags: {
                            some: {
                                Tags: {
                                    tag_name: { contains: q, mode: 'insensitive' }
                                }
                            }
                        }
                    }
                ]
            };

            const totalResults = await prisma.questions.count({
                where: whereClause
            });

            const questions = await prisma.questions.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                orderBy: { created_at: 'desc' },

                select: {
                    question_id: true,
                    title: true,
                    body: true,
                    views_count: true,
                    created_at: true,
                    Author: {
                        select: { username: true, profile_image: true, reputation: true }
                    },
                    Question_Tags: {
                        select: { Tags: { select: { tag_name: true } } }
                    },
                    Votes: { select: { vote_type: true } },
                    _count: { select: { Answers: true } }
                }
            });

            const formattedQuestions = questions.map(q => {
                const score = q.Votes.reduce((acc, curr) => acc + (curr.vote_type || 0), 0);
                const bodySnippet = q.body.length > 150 ? q.body.substring(0, 150) + '...' : q.body;
                const tags = q.Question_Tags.map(qt => qt.Tags.tag_name);

                return {
                    question_id: q.question_id,
                    title: q.title,
                    summary: bodySnippet,
                    views: q.views_count,
                    score: score,
                    answers_count: q._count.Answers,
                    created_at: q.created_at,
                    author: q.Author,
                    tags: tags
                };
            });

            res.status(200).json({
                success: true,
                count: formattedQuestions.length,
                total: totalResults,
                totalPages: Math.ceil(totalResults / limit),
                currentPage: page,
                data: formattedQuestions
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
    /**
     * a function that show us the history of changing this question
     * it is look like a version control
     * @req : is the request
     * @res : is the response
     * returns void
     */
    async getQuestionHistory(req, res) {
        try {
            const { id } = req.params;
            const questionId = parseInt(id);

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            if (isNaN(questionId)) {
                return res.status(400).json({ success: false, message: "Invalid ID" });
            }

            const totalHistory = await prisma.edit_History.count({
                where: { 
                    question_id: questionId 
                }
            });

            const history = await prisma.edit_History.findMany({
                where: { 
                    question_id: questionId 
                },
                skip: skip,      
                take: limit,     
                include: {
                    Users: {
                        select: { username: true, profile_image: true }
                    }
                },
                orderBy: {
                    created_at: 'desc' 
                }
            });

            res.status(200).json({
                success: true,
                count: history.length,     
                total: totalHistory,       
                totalPages: Math.ceil(totalHistory / limit),
                currentPage: page,
                data: history
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

export default new QuestionController();