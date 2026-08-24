-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────
CREATE TYPE report_category AS ENUM (
  'WATER', 'ROAD', 'ELECTRICITY', 'SANITATION',
  'HEALTHCARE', 'EDUCATION', 'TRANSPORT', 'OTHER'
);

CREATE TYPE report_status AS ENUM (
  'PENDING', 'ANALYZING', 'ANALYZED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'
);

CREATE TYPE hotspot_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'CITIZEN', -- CITIZEN | OFFICIAL | ADMIN
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Reports ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  text         TEXT NOT NULL,
  category     report_category NOT NULL DEFAULT 'OTHER',
  severity     FLOAT NOT NULL DEFAULT 0.5,       -- 0.0 – 1.0
  urgency      FLOAT NOT NULL DEFAULT 0.5,       -- 0.0 – 1.0
  status       report_status NOT NULL DEFAULT 'PENDING',
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  location     GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                 ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
               ) STORED,
  address      TEXT,
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_location  ON reports USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_reports_category  ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status    ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created   ON reports(created_at DESC);

-- ─── AI Analyses ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_analyses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id   UUID UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  category    report_category NOT NULL,
  severity    FLOAT NOT NULL,
  urgency     FLOAT NOT NULL,
  summary     TEXT NOT NULL,
  entities    TEXT[] NOT NULL DEFAULT '{}',
  embedding   vector(384),                 -- MiniLM-L12-v2 output dimension
  confidence  FLOAT NOT NULL DEFAULT 0.0,
  raw_llm     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_embedding
  ON ai_analyses USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── Hotspots ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotspots (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  category         report_category NOT NULL,
  severity         hotspot_severity NOT NULL DEFAULT 'MEDIUM',
  report_count     INT NOT NULL DEFAULT 0,
  affected_pop     INT NOT NULL DEFAULT 0,
  centroid         GEOMETRY(Point, 4326),
  boundary         GEOMETRY(Polygon, 4326),
  priority_score   FLOAT NOT NULL DEFAULT 0.0,  -- 0–100
  first_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotspots_centroid  ON hotspots USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_hotspots_score     ON hotspots(priority_score DESC);

-- ─── Recommendations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotspot_id      UUID REFERENCES hotspots(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  action          TEXT NOT NULL,
  priority_score  FLOAT NOT NULL DEFAULT 0.0,
  evidence        JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'OPEN',  -- OPEN | ACCEPTED | IN_PROGRESS | DONE
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed admin user ─────────────────────────────────────────
-- Password: admin123 (bcrypt hash - change in production)
INSERT INTO users (email, name, role, password)
VALUES (
  'admin@nasmr.gov',
  'Admin User',
  'ADMIN',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
) ON CONFLICT (email) DO NOTHING;
