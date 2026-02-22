const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPreferences = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true }
    });
    return user?.preferences || {};
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

module.exports = {
    getPreferences,
    updatePreferences,
    getUserStats
};
