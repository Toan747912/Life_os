const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ===== TRANSACTIONS =====

const getTransactions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { month, year, type, categoryId } = req.query;

        const now = new Date();
        const filterMonth = parseInt(month) || (now.getMonth() + 1);
        const filterYear = parseInt(year) || now.getFullYear();

        const startDate = new Date(filterYear, filterMonth - 1, 1);
        const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59);

        const where = {
            userId,
            date: { gte: startDate, lte: endDate },
        };
        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;

        const transactions = await prisma.transaction.findMany({
            where,
            include: { category: true },
            orderBy: { date: 'desc' },
        });

        res.json({ data: transactions });
    } catch (err) {
        next(err);
    }
};

const createTransaction = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { amount, type, categoryId, note, date } = req.body;

        if (!amount || !type) {
            return res.status(400).json({ error: 'amount và type là bắt buộc.' });
        }
        if (!['INCOME', 'EXPENSE'].includes(type)) {
            return res.status(400).json({ error: 'type phải là INCOME hoặc EXPENSE.' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                amount: parseFloat(amount),
                type,
                categoryId: categoryId || null,
                note: note || null,
                date: date ? new Date(date) : new Date(),
            },
            include: { category: true },
        });

        res.status(201).json({ data: transaction });
    } catch (err) {
        next(err);
    }
};

const updateTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount, type, categoryId, note, date } = req.body;

        const existing = await prisma.transaction.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Không tìm thấy giao dịch.' });

        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                ...(amount !== undefined && { amount: parseFloat(amount) }),
                ...(type && { type }),
                ...(categoryId !== undefined && { categoryId }),
                ...(note !== undefined && { note }),
                ...(date && { date: new Date(date) }),
            },
            include: { category: true },
        });

        res.json({ data: updated });
    } catch (err) {
        next(err);
    }
};

const deleteTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existing = await prisma.transaction.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Không tìm thấy giao dịch.' });

        await prisma.transaction.delete({ where: { id } });
        res.json({ message: 'Đã xóa giao dịch.' });
    } catch (err) {
        next(err);
    }
};

// ===== SUMMARY =====

const getSummary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.query;

        const now = new Date();
        const filterMonth = parseInt(month) || (now.getMonth() + 1);
        const filterYear = parseInt(year) || now.getFullYear();

        const startDate = new Date(filterYear, filterMonth - 1, 1);
        const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59);

        // Lấy tất cả transactions trong tháng
        const transactions = await prisma.transaction.findMany({
            where: { userId, date: { gte: startDate, lte: endDate } },
            include: { category: true },
        });

        // Tính tổng thu/chi
        const totalIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        // Chi tiêu theo category
        const byCategory = {};
        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            const catName = t.category?.name || 'Không có danh mục';
            const catId = t.categoryId || 'uncategorized';
            if (!byCategory[catId]) {
                byCategory[catId] = {
                    name: catName,
                    icon: t.category?.icon || '💰',
                    color: t.category?.color || '#6366f1',
                    total: 0,
                };
            }
            byCategory[catId].total += t.amount;
        });

        // Chi tiêu theo ngày trong tháng (cho chart)
        const byDay = {};
        transactions.forEach(t => {
            const day = new Date(t.date).getDate();
            if (!byDay[day]) byDay[day] = { income: 0, expense: 0 };
            if (t.type === 'INCOME') byDay[day].income += t.amount;
            else byDay[day].expense += t.amount;
        });

        // Lấy budgets tháng này
        const budgets = await prisma.budget.findMany({
            where: { userId, month: filterMonth, year: filterYear },
            include: { category: true },
        });

        res.json({
            data: {
                month: filterMonth,
                year: filterYear,
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                byCategory: Object.values(byCategory),
                byDay,
                budgets,
                recentTransactions: transactions.slice(0, 5),
            }
        });
    } catch (err) {
        next(err);
    }
};

// ===== CATEGORIES =====

const getCategories = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const categories = await prisma.financeCategory.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
        res.json({ data: categories });
    } catch (err) {
        next(err);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, icon, color, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'name và type là bắt buộc.' });
        }

        const category = await prisma.financeCategory.create({
            data: { userId, name, icon: icon || '💰', color: color || '#6366f1', type },
        });
        res.status(201).json({ data: category });
    } catch (err) {
        next(err);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existing = await prisma.financeCategory.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Không tìm thấy danh mục.' });

        await prisma.financeCategory.delete({ where: { id } });
        res.json({ message: 'Đã xóa danh mục.' });
    } catch (err) {
        next(err);
    }
};

// ===== BUDGETS =====

const upsertBudget = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { categoryId, amount, month, year } = req.body;

        if (!categoryId || !amount || !month || !year) {
            return res.status(400).json({ error: 'categoryId, amount, month, year là bắt buộc.' });
        }

        const budget = await prisma.budget.upsert({
            where: {
                userId_categoryId_month_year: {
                    userId, categoryId,
                    month: parseInt(month),
                    year: parseInt(year),
                },
            },
            update: { amount: parseFloat(amount) },
            create: {
                userId, categoryId,
                amount: parseFloat(amount),
                month: parseInt(month),
                year: parseInt(year),
            },
            include: { category: true },
        });

        res.json({ data: budget });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getSummary,
    getCategories,
    createCategory,
    deleteCategory,
    upsertBudget,
};
