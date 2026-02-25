const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ActivityService {
    async logActivity(userId, action) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Convert strictly to midnight for tracking day

        // 1. Log or update ActivityLog
        const existingLog = await prisma.activityLog.findFirst({
            where: { userId, action, date: today }
        });

        if (existingLog) {
            await prisma.activityLog.update({
                where: { id: existingLog.id },
                data: { count: { increment: 1 } }
            });
        } else {
            await prisma.activityLog.create({
                data: { userId, action, date: today }
            });
        }

        // 2. Update Streak
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;

        let { currentStreak, longestStreak, lastActiveDate } = user;

        const lastActive = lastActiveDate ? new Date(lastActiveDate) : null;
        if (lastActive) lastActive.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (!lastActive) {
            currentStreak = 1;
            longestStreak = 1;
        } else if (lastActive.getTime() === yesterday.getTime()) {
            currentStreak += 1;
            if (currentStreak > longestStreak) longestStreak = currentStreak;
        } else if (lastActive.getTime() < yesterday.getTime()) {
            currentStreak = 1;
        }
        // If lastActive is today, streak remains the same.

        await prisma.user.update({
            where: { id: userId },
            data: {
                currentStreak,
                longestStreak,
                lastActiveDate: new Date() // Store exact current time, but logic uses date component
            }
        });

        return { currentStreak, longestStreak };
    }

    async getStreak(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
        if (lastActive) lastActive.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let currentStreak = user.currentStreak;

        // Virtual reset when fetching if missed yesterday (without writing to DB yet)
        if (lastActive && lastActive.getTime() < yesterday.getTime()) {
            currentStreak = 0;
        }

        return {
            currentStreak,
            longestStreak: user.longestStreak,
            lastActiveDate: user.lastActiveDate
        };
    }

    async getHeatmap(userId) {
        const logs = await prisma.activityLog.findMany({
            where: { userId },
            orderBy: { date: 'asc' }
        });

        const heatmapMap = {};
        for (const log of logs) {
            const dateStr = log.date.toISOString().split('T')[0];
            if (!heatmapMap[dateStr]) {
                heatmapMap[dateStr] = 0;
            }
            heatmapMap[dateStr] += log.count;
        }

        const heatmapData = Object.keys(heatmapMap).map(dateStr => ({
            date: dateStr,
            count: heatmapMap[dateStr]
        }));

        return heatmapData;
    }

    async getQuests(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const logs = await prisma.activityLog.findMany({
            where: { userId, date: today }
        });

        let flashcardCount = 0;
        let shadowCount = 0;
        let writeCount = 0;

        logs.forEach(log => {
            if (log.action === 'REVIEW_FLASHCARD') flashcardCount += log.count;
            if (log.action === 'PRACTICE_SHADOWING') shadowCount += log.count;
            if (log.action === 'PRACTICE_WRITING') writeCount += log.count;
        });

        return [
            { id: 1, title: 'Ôn 10 từ vựng', current: flashcardCount, target: 10, completed: flashcardCount >= 10 },
            { id: 2, title: 'Luyện Shadowing 3 câu', current: shadowCount, target: 3, completed: shadowCount >= 3 },
            { id: 3, title: 'Viết 1 đoạn văn', current: writeCount, target: 1, completed: writeCount >= 1 }
        ];
    }
}

module.exports = new ActivityService();
