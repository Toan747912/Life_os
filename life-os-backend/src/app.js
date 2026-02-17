const express = require('express');
const cors = require('cors');
const learningRoutes = require('./routes/learning.routes');
const taskRoutes = require('./routes/task.routes'); // Import routes mới

const app = express();

app.use(cors());
app.use(express.json()); // Để đọc được JSON từ body request

// Đăng ký routes
app.use('/api/learning', learningRoutes);
app.use('/api/tasks', taskRoutes); // <--- Thêm dòng này

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Life OS đang chạy tại port ${PORT}`);
});