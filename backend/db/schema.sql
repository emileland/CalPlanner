CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    public_ics_token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_project_dates CHECK (
        end_date IS NULL OR start_date IS NULL OR end_date >= start_date
    )
);

CREATE TABLE IF NOT EXISTS calendars (
    calendar_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type BOOLEAN NOT NULL DEFAULT TRUE,
    label TEXT,
    color TEXT,
    last_synced TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
    module_id SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL REFERENCES calendars(calendar_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_selected BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_modules_calendar_name
    ON modules (calendar_id, lower(name));

CREATE TABLE IF NOT EXISTS events (
    event_id SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL REFERENCES calendars(calendar_id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
    external_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_calendar_id ON modules(calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_calendar_time ON events(calendar_id, start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_external ON events(calendar_id, external_id);
