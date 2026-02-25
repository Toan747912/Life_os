const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPreferences = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true }
    });
    if (!user) throw new Error('User not found');

    let prefs = user.preferences || {};
    if (typeof prefs === 'string') {
        try { prefs = JSON.parse(prefs); } catch (e) { prefs = {}; }
    }
    return prefs;
};

const updatePreferences = async (userId, preferences) => {
    const current = await getPreferences(userId);
    const updated = { ...current, ...preferences };

    return await prisma.user.update({
        where: { id: userId },
        data: { preferences: updated }
    });
};

const getUserStats = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            currentStreak: true,
            longestStreak: true,
            // Calculate total items learned
            progress: {
                select: { id: true }
            }
        }
    });

    if (!user) return null;

    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalLearned: user.progress.length
    };
};



const getUserInsights = async (userId) => {
    // 1. Weakest Words (Top 5 words with lowest proficiency)
    const weakestProgress = await prisma.userProgress.findMany({
        where: { userId },
        orderBy: [
            { proficiency: 'asc' },
            { lastReviewedAt: 'asc' }
        ],
        take: 5,
        include: {
            item: { select: { term: true, translation: true, type: true } }
        }
    });

    const weakestWords = weakestProgress.map(p => ({
        term: p.item.term,
        translation: p.item.translation,
        type: p.item.type,
        proficiency: p.proficiency
    }));

    // 2. Words learned per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.activityLog.findMany({
        where: {
            userId,
            action: 'ADD_VOCAB',
            date: { gte: thirtyDaysAgo }
        },
        orderBy: { date: 'asc' }
    });

    const wordsLearnedPerDay = logs.map(log => ({
        date: log.date.toISOString().split('T')[0],
        count: log.count
    }));

    return {
        weakestWords,
        wordsLearnedPerDay
    };
};

module.exports = {
    getPreferences,
    updatePreferences,
    getUserStats,
    getUserInsights
};
