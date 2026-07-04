-- Chapter 4: tasks table for the authenticated dashboard.
-- user_id holds the Neon Auth user id (string), no FK — auth users live
-- in the neon_auth schema managed by Neon.

CREATE TABLE IF NOT EXISTS tasks (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    TEXT        NOT NULL,
    title      TEXT        NOT NULL,
    completed  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The dashboard always filters by the signed-in user.
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);

-- Keep updated_at accurate without the API having to remember to set it.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;
CREATE TRIGGER tasks_set_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
