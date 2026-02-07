-- MySQL schema for users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user'
);

-- MySQL schema for tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    token VARCHAR(512) NOT NULL,
    expiresAt DATETIME NOT NULL,
    invalidated BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert initial admin user (password: adminpassword)
INSERT INTO users (username, passwordHash, role) VALUES ('admin', '$2b$10$w0ha/JcTQVIRpdaFDTjV..LFdqq1I92O9mkaJ5pslCBlQoZ15MaZK', 'admin')
    ON DUPLICATE KEY UPDATE username=username;