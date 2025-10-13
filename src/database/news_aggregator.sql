CREATE DATABASE IF NOT EXISTS news_aggregator;
USE news_aggregator;

-- Users table with all columns defined at creation
CREATE TABLE IF NOT EXISTS users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    twitter_id VARCHAR(255) UNIQUE,
    profile_picture VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    name VARCHAR(255),
    preferred_sources JSON,
    preferred_categories JSON,
    preferred_authors JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles(
    id INT AUTO_INCREMENT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    author VARCHAR(255),
    source_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    published_at DATETIME,
    url VARCHAR(512) UNIQUE NOT NULL,
    url_to_image VARCHAR(512),
    source_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_source_name (source_name),
    INDEX idx_category (category),
    INDEX idx_published_at (published_at),
    INDEX idx_author (author),
    INDEX idx_source_id (source_id),
    FULLTEXT idx_search (title, description, content)  -- For text search
);

-- Saved articles table
CREATE TABLE IF NOT EXISTS saved_articles(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    article_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_article (user_id, article_id),
    INDEX idx_user_id (user_id),
    INDEX idx_article_id (article_id)
);

-- Create a table for API request logs
CREATE TABLE IF NOT EXISTS api_logs(
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_source VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    status_code INT,
    response_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_source (api_source),
    INDEX idx_created_at (created_at)
);

-- Create a table for categories master data
CREATE TABLE IF NOT EXISTS categories(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT IGNORE INTO categories (name, display_name) VALUES
('general', 'General'),
('business', 'Business'),
('entertainment', 'Entertainment'),
('health', 'Health'),
('science', 'Science'),
('sports', 'Sports'),
('technology', 'Technology'),
('politics', 'Politics'),
('world', 'World News');

-- Create a table for news sources master data
CREATE TABLE IF NOT EXISTS news_sources(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    website_url VARCHAR(512),
    api_source VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert common news sources
INSERT IGNORE INTO news_sources (name, display_name, api_source) VALUES
('newsapi', 'NewsAPI', 'newsapi'),
('the-guardian', 'The Guardian', 'guardian'),
('new-york-times', 'New York Times', 'nyt'),
('bbc-news', 'BBC News', 'newsapi'),
('cnn', 'CNN', 'newsapi'),
('reuters', 'Reuters', 'newsapi');