-- MySQL schema for users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user'
);

-- Insert initial admin user (password: adminpassword)
INSERT INTO users (username, passwordHash, role) VALUES ('admin', '$2b$10$w0ha/JcTQVIRpdaFDTjV..LFdqq1I92O9mkaJ5pslCBlQoZ15MaZK', 'admin')
    ON DUPLICATE KEY UPDATE username=username;