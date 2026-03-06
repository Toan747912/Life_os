const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardData = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true, currentStreak: true, badges: true }
    });

    // Lấy ngày hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sinh hoặc lấy Daily Quests
    let quests = await prisma.dailyQuest.findMany({
        where: { userId, date: today }
    });

    if (quests.length === 0) {
        // Tạo quest mặc định nếu chưa có
        quests = await prisma.$transaction([
            prisma.dailyQuest.create({ data: { userId, date: today, type: 'DICTATION', target: 1, xpReward: 50 } }),
            prisma.dailyQuest.create({ data: { userId, date: today, type: 'VOCAB_REVIEW', target: 20, xpReward: 30 } }),
            prisma.dailyQuest.create({ data: { userId, date: today, type: 'STORY_READING', target: 1, xpReward: 40 } })
        ]);
    }

    const goals = await prisma.goal.findMany({
        where: { userId, status: 'IN_PROGRESS' }
    });

    return { user, quests, goals };
};

const addXP = async (userId, amount) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    let newXp = user.xp + amount;
    let newLevel = user.level;
    let leveledUp = false;

    // Giả sử mỗi level cần 500 XP
    const xpNeededForNextLevel = newLevel * 500;
    if (newXp >= xpNeededForNextLevel) {
        newLevel += 1;
        newXp -= xpNeededForNextLevel;
        leveledUp = true;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { xp: newXp, level: newLevel },
        select: { xp: true, level: true }
    });

    return { ...updatedUser, leveledUp };
};

const updateQuestProgress = async (userId, questType, progressAmount = 1) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const quest = await prisma.dailyQuest.findUnique({
        where: {
            userId_date_type: { userId, date: today, type: questType }
        }
    });

    if (!quest || quest.isCompleted) return null;

    const newProgress = Math.min(quest.progress + progressAmount, quest.target);
    const isCompleted = newProgress >= quest.target;

    const updatedQuest = await prisma.dailyQuest.update({
        where: { id: quest.id },
        data: { progress: newProgress, isCompleted }
    });

    let xpResult = null;
    if (isCompleted) {
        xpResult = await addXP(userId, quest.xpReward);
    }

    return { quest: updatedQuest, xpResult };
};

const createGoal = async (userId, data) => {
    return await prisma.goal.create({
        data: {
            userId,
            title: data.title,
            target: data.target,
            deadline: data.deadline ? new Date(data.deadline) : null
        }
    });
};

const updateGoalProgress = async (userId, goalId, progressAmount) => {
    const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new Error("Goal not found");

    const newProgress = Math.min(goal.currentProgress + progressAmount, goal.target);
    const status = newProgress >= goal.target ? 'ACHIEVED' : 'IN_PROGRESS';

    return await prisma.goal.update({
        where: { id: goalId },
        data: { currentProgress: newProgress, status }
    });
};

module.exports = {
    getDashboardData,
    addXP,
    updateQuestProgress,
    createGoal,
    updateGoalProgress
};
