CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    public_ics_token VARCHAR(255) UNIQUE,
    view_start_hour TINYINT,
    view_end_hour TINYINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_users FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    CONSTRAINT chk_project_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS calendars (
    calendar_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    url TEXT NOT NULL,
    type TINYINT(1) NOT NULL DEFAULT 1,
    label VARCHAR(255),
    color VARCHAR(20),
    last_synced DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_calendars_projects FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modules (
    module_id INT AUTO_INCREMENT PRIMARY KEY,
    calendar_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_selected TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_modules_calendars FOREIGN KEY (calendar_id) REFERENCES calendars(calendar_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_modules_calendar_name ON modules (calendar_id, name(191));

CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    calendar_id INT NOT NULL,
    module_id INT NOT NULL,
    external_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_calendars FOREIGN KEY (calendar_id) REFERENCES calendars(calendar_id) ON DELETE CASCADE,
    CONSTRAINT fk_events_modules FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

CREATE INDEX idx_modules_calendar_id ON modules(calendar_id);
CREATE INDEX idx_events_calendar_time ON events(calendar_id, start_time);
CREATE UNIQUE INDEX idx_events_external ON events(calendar_id, external_id);
