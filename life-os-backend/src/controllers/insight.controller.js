const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiService = require('../services/ai.service');

// Generate AI Insight
exports.generateLearningInsight = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // 1. Lấy dữ liệu user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, level: true, currentStreak: true }
        });

        // 2. Lấy 5 lần dictation gần nhất
        const dictations = await prisma.dictationAttempt.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { accuracyScore: true, createdAt: true }
        });

        // 3. Lấy số từ vựng tạo gần đây
        const newVocabCount = await prisma.learningItem.count({
            where: {
                userId,
                createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
            }
        });

        const userData = {
            level: user.level,
            xp: user.xp,
            streak: user.currentStreak,
            recentDictationScores: dictations.map(d => d.accuracyScore),
            newVocabsLast7Days: newVocabCount
        };

        // 4. Gọi AI sinh Insight
        const aiInsight = await aiService.generateInsightWithGemini(userData);

        // 5. Lưu vào DB
        const newInsight = await prisma.insight.create({
            data: {
                title: aiInsight.title,
                content: aiInsight.content,
                category: aiInsight.category || 'AI Analysis',
                tags: aiInsight.tags || [],
                userId
            }
        });

        res.status(201).json({
            status: 'success',
            data: { insight: newInsight }
        });

    } catch (error) {
        console.error('Generate insight error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create a new insight
exports.createInsight = async (req, res, next) => {
    try {
        const { title, content, category, tags } = req.body;
        const userId = req.user.id; // from auth middleware

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tiêu đề và nội dung' });
        }

        const newInsight = await prisma.insight.create({
            data: {
                title,
                content,
                category: category || 'Error',
                tags: tags || [],
                userId
            }
        });

        res.status(201).json({
            status: 'success',
            data: {
                insight: newInsight
            }
        });
    } catch (error) {
        console.error('Create insight error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all insights for logged in user
exports.getInsights = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { category, search } = req.query;

        const query = {
            where: { userId }
        };

        if (category && category !== 'All') {
            query.where.category = category;
        }

        if (search) {
            query.where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }

        const insights = await prisma.insight.findMany({
            ...query,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                content: true,
                category: true,
                tags: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            status: 'success',
            results: insights.length,
            data: {
                insights
            }
        });
    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update an insight
exports.updateInsight = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, category, tags } = req.body;
        const userId = req.user.id;

        const insight = await prisma.insight.findFirst({
            where: { id, userId }
        });

        if (!insight) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bí quyết hoặc bạn không có quyền sửa.' });
        }

        const updatedInsight = await prisma.insight.update({
            where: { id },
            data: {
                title: title !== undefined ? title : insight.title,
                content: content !== undefined ? content : insight.content,
                category: category !== undefined ? category : insight.category,
                tags: tags !== undefined ? tags : insight.tags
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                insight: updatedInsight
            }
        });
    } catch (error) {
        console.error('Update insight error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete an insight
exports.deleteInsight = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const insight = await prisma.insight.findFirst({
            where: { id, userId }
        });

        if (!insight) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bí quyết hoặc bạn không có quyền xoá.' });
        }

        await prisma.insight.delete({
            where: { id }
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        console.error('Delete insight error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
