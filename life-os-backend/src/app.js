const express = require('express');
const cors = require('cors');
const learningRoutes = require('./routes/learning.routes');
const taskRoutes = require('./routes/task.routes');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const dictationRoutes = require('./routes/dictation.routes');
const authMiddleware = require('./middleware/auth');

const app = express();

const path = require('path');

app.use(cors());
app.use(express.json());

// Phục vụ các file media upload (Video/Audio) static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public routes (Không cần authenticate)
app.use('/api/auth', authRoutes);

app.use(authMiddleware);

app.use('/api/dictations', dictationRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/user', userRoutes);
app.use('/api/activity', require('./routes/activity.routes'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server Life OS đang chạy tại port ${PORT} `);
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});