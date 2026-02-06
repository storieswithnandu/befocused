-- Run this SQL in your Vercel Postgres query console

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  reset_code TEXT,
  reset_code_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Pre-create your account if you want to skip signup
-- Note: You should use a hashed password if inserting manually.
-- It's safer to just use the Signup page once you deploy.
