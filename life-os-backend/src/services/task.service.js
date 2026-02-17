const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTasksByDate = async (userId, dateStr) => {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.task.findMany({
        where: {
            userId: userId,
            dueDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            resource: true
        },
        orderBy: {
            priority: 'desc'
        }
    });
};

const toggleTaskStatus = async (taskId, userId) => {
    // 1. Tìm task hiện tại
    const task = await prisma.task.findFirst({
        where: { id: taskId, userId: userId }
    });

    if (!task) throw new Error("Task not found");

    // 2. Đổi trạng thái (TODO <-> DONE)
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";

    return await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus }
    });
};

module.exports = {
    getTasksByDate,
    toggleTaskStatus
};