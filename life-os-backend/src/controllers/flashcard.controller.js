const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get flashcards that are due for review
exports.getDueFlashcards = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        const dueCards = await prisma.userProgress.findMany({
            where: {
                userId,
                nextReviewDate: {
                    lte: now
                }
            },
            include: {
                item: true
            },
            orderBy: {
                nextReviewDate: 'asc'
            }
        });

        res.status(200).json({ success: true, count: dueCards.length, data: dueCards });
    } catch (error) {
        console.error('Get due flashcards error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Internal function to calculate SM-2
const calculateSM2 = (quality, easeFactor, interval, repetition) => {
    let newRepetition = repetition;
    let newInterval = interval;
    let newEaseFactor = easeFactor;

    if (quality >= 3) {
        if (repetition === 0) {
            newInterval = 1;
        } else if (repetition === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.round(interval * easeFactor);
        }
        newRepetition += 1;
    } else {
        newRepetition = 0;
        newInterval = 1;
    }

    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    return { newInterval, newRepetition, newEaseFactor };
};

// Submit a review for a flashcard
exports.reviewFlashcard = async (req, res) => {
    try {
        const progressId = req.params.id;
        const { quality } = req.body; // 0, 1, 2, 3, 4, 5
        const userId = req.user.id;

        if (quality < 0 || quality > 5 || quality === undefined) {
            return res.status(400).json({ success: false, message: 'Quality rating must be between 0 and 5' });
        }

        const progress = await prisma.userProgress.findFirst({
            where: {
                id: progressId,
                userId
            }
        });

        if (!progress) {
            return res.status(404).json({ success: false, message: 'Flashcard progress not found' });
        }

        const { newInterval, newRepetition, newEaseFactor } = calculateSM2(
            quality,
            progress.easeFactor,
            progress.interval,
            progress.repetition
        );

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        // Save history
        let history = [];
        if (progress.reviewHistory) {
            history = typeof progress.reviewHistory === 'string' ? JSON.parse(progress.reviewHistory) : progress.reviewHistory;
        }
        if (!Array.isArray(history)) {
            history = [];
        }

        history.push({
            date: new Date().toISOString(),
            quality,
            interval: newInterval,
            easeFactor: newEaseFactor
        });

        const updatedProgress = await prisma.userProgress.update({
            where: { id: progressId },
            data: {
                interval: newInterval,
                repetition: newRepetition,
                easeFactor: newEaseFactor,
                nextReviewDate,
                lastReviewedAt: new Date(),
                reviewHistory: history,
                proficiency: Math.min(newRepetition, 5) // roughly mapping repetition to 0-5
            }
        });

        res.status(200).json({ success: true, data: updatedProgress });
    } catch (error) {
        console.error('Review flashcard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
