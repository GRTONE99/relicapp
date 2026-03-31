-- Performance indexes: cover the most frequent query patterns to avoid
-- full-table scans as the user base grows.

-- Per-user item fetch (primary access pattern for all collection views)
CREATE INDEX IF NOT EXISTS idx_collection_items_user_id
  ON collection_items(user_id);

-- Sorted per-user fetch (default listing order is created_at DESC)
CREATE INDEX IF NOT EXISTS idx_collection_items_user_created
  ON collection_items(user_id, created_at DESC);

-- Roster-page sport and category filter dropdowns
CREATE INDEX IF NOT EXISTS idx_collection_items_sport
  ON collection_items(sport);

CREATE INDEX IF NOT EXISTS idx_collection_items_category
  ON collection_items(category);

CREATE INDEX IF NOT EXISTS idx_collection_items_sport_category
  ON collection_items(sport, category);

-- Profile lookups by user (foreign key access pattern)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON profiles(user_id);
