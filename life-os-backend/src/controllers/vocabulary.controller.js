const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add a new vocabulary from Dictation or manually
exports.addVocabulary = async (req, res) => {
    try {
        const { term, definition, exampleSentence, resourceId, extraInfo } = req.body;
        const userId = req.user.id;

        if (!term) {
            return res.status(400).json({ success: false, message: 'Term is required' });
        }

        // Check if the term already exists for this user in LearningItem
        let learningItem = await prisma.learningItem.findFirst({
            where: {
                term,
                userId
            }
        });

        if (!learningItem) {
            learningItem = await prisma.learningItem.create({
                data: {
                    term,
                    definition,
                    exampleSentence,
                    extraInfo: extraInfo || {},
                    resourceId,
                    userId,
                    type: 'VOCABULARY'
                }
            });
        }

        // Check if UserProgress already exists
        let userProgress = await prisma.userProgress.findUnique({
            where: {
                userId_itemId: {
                    userId,
                    itemId: learningItem.id
                }
            }
        });

        if (userProgress) {
            return res.status(400).json({ success: false, message: 'Vocabulary already saved to your vault.' });
        }

        // Create UserProgress with repetition 0, interval 0, default nextReviewDate (now)
        userProgress = await prisma.userProgress.create({
            data: {
                userId,
                itemId: learningItem.id,
                nextReviewDate: new Date(),
                interval: 0,
                repetition: 0,
                easeFactor: 2.5
            }
        });

        res.status(201).json({
            success: true,
            message: 'Vocabulary added to your vault.',
            data: { learningItem, userProgress }
        });
    } catch (error) {
        console.error('Add vocabulary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all vocabularies for the user's vault
exports.getVocabularies = async (req, res) => {
    try {
        const userId = req.user.id;

        const vocabularies = await prisma.userProgress.findMany({
            where: { userId },
            include: {
                item: true
            },
            orderBy: {
                lastReviewedAt: 'desc'
            }
        });

        res.status(200).json({ success: true, data: vocabularies });
    } catch (error) {
        console.error('Get vocabularies error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a vocabulary from the user's vault
exports.deleteVocabulary = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const progressItem = await prisma.userProgress.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                item: true
            }
        });

        if (!progressItem) {
            return res.status(404).json({ success: false, message: 'Vocabulary not found in your vault.' });
        }

        if (progressItem.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized action.' });
        }

        const learningItemId = progressItem.itemId;

        // First delete UserProgress (the flashcard learning state)
        await prisma.userProgress.delete({
            where: {
                id: parseInt(id)
            }
        });

        // Optionally restrict deletion of LearningItem if it's shared across users
        // But in this isolated design, if another UserProgress doesn't exist for this LearningItem, we can safely delete it too.
        const otherProgressCount = await prisma.userProgress.count({
            where: { itemId: learningItemId }
        });

        if (otherProgressCount === 0) {
            await prisma.learningItem.delete({
                where: { id: learningItemId }
            });
        }

        res.status(200).json({ success: true, message: 'Vocabulary deleted successfully.' });
    } catch (error) {
        console.error('Delete vocabulary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
