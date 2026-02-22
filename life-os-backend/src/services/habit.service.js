const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Service quản lý thói quen học tập (Daily Quests, Streak, Heatmap)
 */

/**
 * Ghi nhận một hành động của user vào ActivityLog và cập nhật Streak.
 * Được gọi tự động khi user học từ vựng, thêm tài liệu, v.v.
 * @param {String} userId 
 * @param {String} action - 'STUDY_SESSION', 'ADD_VOCAB', 'FOCUS_TIMER'
 */
const logActivity = async (userId, action) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày để dễ group

        // 1. Transaction để đảm bảo tính toàn vẹn khi vừa update chuỗi vừa ghi log
        await prisma.$transaction(async (tx) => {
            // A. Ghi log activity (Upsert: Có rồi thì tăng count, chưa có thì tạo mới)
            const existingLog = await tx.activityLog.findFirst({
                where: {
                    userId: userId,
                    action: action,
                    date: today
                }
            });

            if (existingLog) {
                await tx.activityLog.update({
                    where: { id: existingLog.id },
                    data: { count: existingLog.count + 1 }
                });
            } else {
                await tx.activityLog.create({
                    data: {
                        userId: userId,
                        action: action,
                        date: today
                    }
                });
            }

            // B. Cập nhật Streak cho User
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true, longestStreak: true, lastActiveDate: true }
            });

            if (!user) return;

            let newCurrentStreak = user.currentStreak;
            let newLongestStreak = user.longestStreak;
            let lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

            if (lastActive) {
                lastActive.setHours(0, 0, 0, 0);
            }

            const msPerDay = 1000 * 60 * 60 * 24;
            // Tính số ngày chênh lệch giữa hôm nay và lần cuối hoạt động
            const diffDays = lastActive ? Math.round((today - lastActive) / msPerDay) : -1;

            if (diffDays === 1) {
                // Đăng nhập học đều đặn ngày tiếp theo -> Tăng streak
                newCurrentStreak += 1;
            } else if (diffDays > 1 || diffDays === -1) {
                // Nghỉ học hơn 1 ngày hoặc là lần đầu -> Reset streak về 1
                newCurrentStreak = 1;
            }
            // Nếu diffDays === 0 tức là học tiếp trong cùng 1 ngày -> Không đổi streak

            // Cập nhật kỷ lục
            if (newCurrentStreak > newLongestStreak) {
                newLongestStreak = newCurrentStreak;
            }

            // Cập nhật DB
            await tx.user.update({
                where: { id: userId },
                data: {
                    currentStreak: newCurrentStreak,
                    longestStreak: newLongestStreak,
                    lastActiveDate: new Date() // Lưu thời điểm hiện tại thay vì đầu ngày
                }
            });
        });

    } catch (error) {
        console.error("Lỗi khi ghi nhận Activity Log:", error);
        // Không throw error để tránh làm đứt mạch các tính năng chính khác
    }
};

/**
 * Lấy lịch sử ActivityLog của User để vẽ Heatmap
 */
const getHeatmapData = async (userId) => {
    // Lấy log của 365 ngày gần nhất
    const yearAgo = new Date();
    yearAgo.setDate(yearAgo.getDate() - 365);

    const logs = await prisma.activityLog.findMany({
        where: {
            userId: userId,
            date: { gte: yearAgo }
        },
        orderBy: { date: 'asc' }
    });

    // Gom nhóm theo ngày để tính tổng point
    // { "2024-01-01": 5, "2024-01-02": 2 }
    const heatmap = {};
    logs.forEach(log => {
        const dateStr = log.date.toISOString().split('T')[0];
        if (!heatmap[dateStr]) heatmap[dateStr] = 0;
        heatmap[dateStr] += log.count;
    });

    return Object.keys(heatmap).map(date => ({
        date: date,
        count: heatmap[date]
    }));
};

/**
 * Lấy danh sách Daily Quests và trạng thái tiến độ của hôm nay
 */
const getDailyQuestsStatus = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = await prisma.activityLog.findMany({
        where: {
            userId: userId,
            date: today
        }
    });

    // Helper map qua logs
    const getCount = (actionName) => {
        const log = todayLogs.find(l => l.action === actionName);
        return log ? log.count : 0;
    };

    return {
        addVocab: { current: getCount("ADD_VOCAB"), target: 1 },
        studySession: { current: getCount("STUDY_SESSION"), target: 10 }, // 10 thẻ
        focusTimer: { current: getCount("FOCUS_TIMER"), target: 1 }
    };
};

module.exports = {
    logActivity,
    getHeatmapData,
    getDailyQuestsStatus
};
