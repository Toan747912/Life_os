-- Study OS Database Initialization Script
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. AUTH & USERS
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. MODULE 1: TASK & SCHEDULER
-- ==========================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7) DEFAULT '#FFFFFF',
    icon_key VARCHAR(50),
    target_hours_per_week INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE task_priority AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- For sub-tasks
    
    title TEXT NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'NORMAL',
    status task_status DEFAULT 'TODO',
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Recurrence Logic
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT, -- RRULE string e.g. "FREQ=WEEKLY;BYDAY=MO,FR"
    original_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Track origin of generated instance
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. MODULE 2: FOCUS ENGINE
-- ==========================================
CREATE TYPE session_status AS ENUM ('COMPLETED', 'INTERRUPTED');

CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER NOT NULL,
    status session_status DEFAULT 'COMPLETED',
    session_tag VARCHAR(50), -- Tag for analytics (e.g., 'CODE', 'READ', 'DEBUG')
    notes TEXT, -- User reflection after session
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. MODULE 3: KNOWLEDGE BASE
-- ==========================================
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    content TEXT, -- Markdown content
    is_archived BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE note_links (
    source_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_note_id, target_note_id)
);

-- ==========================================
-- 5. MODULE 4: MEMORY SYSTEM (SM-2)
-- ==========================================
CREATE TYPE card_type AS ENUM ('TEXT', 'IMAGE', 'CODE');

CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL, -- Trace back to source note
    
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    card_type card_type DEFAULT 'TEXT',
    
    -- SM-2 Algorithm State
    interval INTEGER DEFAULT 0, -- Days until next review
    repetition INTEGER DEFAULT 0, -- Consecutive correct answers
    ease_factor REAL DEFAULT 2.5,
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 0 AND rating <= 5),
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES & OPTIMIZATIONS
-- ==========================================
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_focus_user_time ON focus_sessions(user_id, start_time);
CREATE INDEX idx_cards_review_date ON flashcards(user_id, next_review_date);
