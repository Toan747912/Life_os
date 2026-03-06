const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const learningRoutes = require('./routes/learning.routes');
const taskRoutes = require('./routes/task.routes');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const dictationRoutes = require('./routes/dictation.routes');
const vocabularyRoutes = require('./routes/vocabulary.routes');
const flashcardRoutes = require('./routes/flashcard.routes');
const insightRoutes = require('./routes/insight.routes');
const financeRoutes = require('./routes/finance.routes');
const deckRoutes = require('./routes/deck.routes');
const gamificationRoutes = require('./routes/gamification.routes');
const aiRoutes = require('./routes/ai.routes');
const conversationRoutes = require('./routes/conversation.routes');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Rate limiting cho auth endpoints (chống brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // tối đa 20 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' },
});

// Rate limiting chung cho toàn bộ API
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 200, // tối đa 200 requests/phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
});

app.use(cors());
app.use(express.json({ limit: '5120mb' }));
app.use(express.urlencoded({ limit: '5120mb', extended: true }));

// Phục vụ các file media upload (Video/Audio) static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limit chung
app.use('/api', generalLimiter);

// Public routes (Không cần authenticate)
app.use('/api/auth', authLimiter, authRoutes);

// Protected routes (Cần authenticate)
app.use(authMiddleware);

app.use('/api/dictations', dictationRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/user', userRoutes);
app.use('/api/activity', require('./routes/activity.routes'));
app.use('/api/vocabularies', vocabularyRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/conversations', conversationRoutes);

// Global error handler (phải mount SAU TẤT CẢ routes)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server Life OS đang chạy tại port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});