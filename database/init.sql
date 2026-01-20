-- 1. Bảng lưu danh sách các bài học (Ví dụ: "Unit 1", "Bài báo CNN"...)
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng lưu từng câu trong bài học đó
CREATE TABLE IF NOT EXISTS sentences (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- Nội dung tiếng Anh
    meaning TEXT,          -- Nghĩa tiếng Việt (tùy chọn)
    "order" INT            -- Thứ tự câu trong bài
);

-- Dữ liệu mẫu (Optional)
-- INSERT INTO lessons (title) VALUES ('Motivational Quotes');
-- INSERT INTO sentences (lesson_id, content, "order") VALUES 
-- (1, 'Success is not final, failure is not fatal.', 1),
-- (1, 'It is the courage to continue that counts.', 2);
