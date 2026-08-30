-- ==========================================
-- Mote (高中生 AI 作文訓練工具) D1 Database Schema
-- ==========================================

-- 1. 使用者與 Session 管理
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. 隨手記錄 (Quick Notes)
CREATE TABLE IF NOT EXISTS quick_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, converted, archived
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. 素材深入訪談對話 (Material Interviews)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quick_note_id TEXT,
    status TEXT DEFAULT 'in_progress', -- in_progress, completed, abandoned
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversation_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 4. 素材庫 (Materials & Tags)
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    story TEXT NOT NULL,
    people_json TEXT,
    time_desc TEXT,
    location_desc TEXT,
    scene_desc TEXT,
    dialogue_desc TEXT,
    emotion_desc TEXT,
    reflection_desc TEXT,
    themes_json TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS material_tags (
    material_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY(material_id, tag_id),
    FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 5. 題目庫 (Prompt Library)
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    raw_text TEXT NOT NULL,
    corrected_text TEXT,
    prompt_type TEXT DEFAULT 'general',
    image_r2_path TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. 電子作文與寫作歷史 Operation Log
CREATE TABLE IF NOT EXISTS essays (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt_id TEXT,
    title TEXT,
    current_content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, submitted, analyzed
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS essay_operations (
    id TEXT PRIMARY KEY,
    essay_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- INSERT, DELETE, REPLACE, AI_SUGGESTION, AI_ACCEPT
    position INTEGER,
    length INTEGER,
    old_content TEXT,
    new_content TEXT,
    source TEXT, -- user, ai
    created_at INTEGER NOT NULL,
    FOREIGN KEY(essay_id) REFERENCES essays(id) ON DELETE CASCADE
);

-- 7. 作文分析報告 (Essay Analysis)
CREATE TABLE IF NOT EXISTS essay_analysis (
    id TEXT PRIMARY KEY,
    essay_id TEXT,
    exam_submission_id TEXT,
    user_id TEXT NOT NULL,
    overall_summary TEXT NOT NULL,
    scores_json TEXT NOT NULL, -- 切題, 立意, 素材, 結構, 描寫, 語言, 情感, 結尾
    strengths_json TEXT NOT NULL,
    weaknesses_json TEXT NOT NULL,
    next_practice_advice TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. 紙本模擬考 (Paper Mock Exam)
CREATE TABLE IF NOT EXISTS exam_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    status TEXT DEFAULT 'in_progress', -- in_progress, submitted, time_out, canceled
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_pages (
    id TEXT PRIMARY KEY,
    exam_session_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    r2_image_path TEXT NOT NULL,
    ocr_raw_text TEXT,
    ocr_confidence REAL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_submissions (
    id TEXT PRIMARY KEY,
    exam_session_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    final_essay_text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

-- 9. 個人弱點與難字庫 (Weaknesses & Vocabulary)
CREATE TABLE IF NOT EXISTS weaknesses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    dimension TEXT NOT NULL, -- 立意, 切題, 結構, 描寫, 語言, 議論, 結尾, 轉折, 素材, 字詞
    description TEXT NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    recent_trend TEXT DEFAULT 'steady', -- improving, steady, deteriorating
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hard_characters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    character_text TEXT NOT NULL,
    zhuyin TEXT,
    source_essay_id TEXT,
    mastery_level INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. AI 用量監控 (AI Usage)
CREATE TABLE IF NOT EXISTS ai_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    model TEXT NOT NULL,
    request_type TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

