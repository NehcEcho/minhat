CREATE TABLE IF NOT EXISTS eeg_analysis_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_id TEXT NOT NULL UNIQUE,
    employee TEXT NOT NULL,
    model TEXT NOT NULL,
    result TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    trend TEXT NOT NULL,
    device_id TEXT NOT NULL,
    data_file_path TEXT NOT NULL,
    sampling_rate REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS device_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    group_name TEXT,
    device_index_id INTEGER,
    device_id TEXT NOT NULL UNIQUE,
    device_name TEXT NOT NULL,
    company_id INTEGER,
    company_name TEXT,
    product_id INTEGER,
    product_code TEXT,
    product_name TEXT,
    status TEXT,
    longitude TEXT,
    latitude TEXT,
    latest_data_json TEXT,
    protocols_json TEXT,
    raw_json TEXT NOT NULL,
    source_updated_at TEXT,
    synced_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alarm_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id INTEGER NOT NULL UNIQUE,
    company_id INTEGER,
    device_index_id INTEGER,
    device_id TEXT,
    device_name TEXT,
    alarm_name TEXT,
    alarm_time INTEGER,
    handle_by TEXT,
    handle_at INTEGER,
    level TEXT,
    status TEXT,
    event_code TEXT,
    fence_id INTEGER,
    handled INTEGER NOT NULL DEFAULT 0,
    raw_json TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS location_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    longitude TEXT NOT NULL,
    latitude TEXT NOT NULL,
    recorded_at INTEGER,
    level TEXT,
    event_code TEXT,
    nearby_electric_state INTEGER,
    raw_json TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(device_id, recorded_at, longitude, latitude)
);

CREATE INDEX IF NOT EXISTS idx_device_snapshots_group_name ON device_snapshots(group_name);
CREATE INDEX IF NOT EXISTS idx_device_snapshots_status ON device_snapshots(status);
CREATE INDEX IF NOT EXISTS idx_alarm_snapshots_device_id ON alarm_snapshots(device_id);
CREATE INDEX IF NOT EXISTS idx_alarm_snapshots_event_code ON alarm_snapshots(event_code);
CREATE INDEX IF NOT EXISTS idx_alarm_snapshots_alarm_time ON alarm_snapshots(alarm_time DESC);
CREATE INDEX IF NOT EXISTS idx_location_points_device_time ON location_points(device_id, recorded_at DESC);
