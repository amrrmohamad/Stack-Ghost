import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MAX_TAGS = 5;

export const addTagsToQuestion = async (questionId, tagIds, userId, isModerator = false) => {
    // Validate question exists and user has permission
    const question = await prisma.questions.findUnique({
        where: { question_id: questionId }
    });

    if (!question) {
        throw new Error('Question not found');
    }

    if (question.user_id !== parseInt(userId) && !isModerator) {
        throw new Error('Not allowed to modify tags for this question');
    }

    if (tagIds.length > MAX_TAGS) {
        throw new Error('Maximum 5 tags allowed');
    }

    // Check existing tags count
    const existingCount = await prisma.question_Tags.count({
        where: { question_id: questionId }
    });

    if (existingCount + tagIds.length > MAX_TAGS) {
        throw new Error('Tag limit exceeded');
    }

    // Validate that all tagIds exist
    const existingTags = await prisma.tags.findMany({
        where: { tag_id: { in: tagIds } }
    });

    if (existingTags.length !== tagIds.length) {
        throw new Error('One or more tags not found');
    }

    const data = tagIds.map(tagId => ({
        question_id: questionId,
        tag_id: tagId
    }));

    await prisma.question_Tags.createMany({
        data,
        skipDuplicates: true
    });

    return true;
};

export const replaceQuestionTags = async (questionId, tagIds, userId, isModerator = false) => {
    // Validate question exists and user has permission
    const question = await prisma.questions.findUnique({
        where: { question_id: questionId }
    });

    if (!question) {
        throw new Error('Question not found');
    }

    if (question.user_id !== parseInt(userId) && !isModerator) {
        throw new Error('Not allowed to modify tags for this question');
    }

    if (tagIds.length > MAX_TAGS) {
        throw new Error('Maximum 5 tags allowed');
    }

    // Validate that all tagIds exist
    if (tagIds.length > 0) {
        const existingTags = await prisma.tags.findMany({
            where: { tag_id: { in: tagIds } }
        });

        if (existingTags.length !== tagIds.length) {
            throw new Error('One or more tags not found');
        }
    }

    await prisma.$transaction([
        prisma.question_Tags.deleteMany({
            where: { question_id: questionId }
        }),
        tagIds.length > 0 ? prisma.question_Tags.createMany({
            data: tagIds.map(tagId => ({
                question_id: questionId,
                tag_id: tagId
            }))
        }) : Promise.resolve()
    ]);

    return true;
};

export const removeTagFromQuestion = async (questionId, tagId, userId, isModerator = false) => {
    // Validate question exists and user has permission
    const question = await prisma.questions.findUnique({
        where: { question_id: questionId }
    });

    if (!question) {
        throw new Error('Question not found');
    }

    if (question.user_id !== parseInt(userId) && !isModerator) {
        throw new Error('Not allowed to modify tags for this question');
    }

    // Check if the tag exists on the question
    const questionTag = await prisma.question_Tags.findUnique({
        where: {
            question_id_tag_id: {
                question_id: questionId,
                tag_id: tagId
            }
        }
    });

    if (!questionTag) {
        throw new Error('Tag not found on this question');
    }

    return prisma.question_Tags.delete({
        where: {
            question_id_tag_id: {
                question_id: questionId,
                tag_id: tagId
            }
        }
    });
};
