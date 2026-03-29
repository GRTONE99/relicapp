-- Migration: add provenance fields to collection_items
--
-- Five provenance fields were being collected in the UI form but had no
-- corresponding database columns — all user-entered data was silently
-- discarded on submit. This migration adds the missing columns so that
-- purchase source, origin, ownership history, event context, and supporting
-- evidence are persisted correctly.

ALTER TABLE public.collection_items
  ADD COLUMN IF NOT EXISTS purchased_from     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS origin             TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS previous_owners    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS event_details      TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS supporting_evidence TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.collection_items.purchased_from      IS 'Where the item was purchased (store, auction house, private seller, etc.)';
COMMENT ON COLUMN public.collection_items.origin              IS 'Geographic or historical origin of the item';
COMMENT ON COLUMN public.collection_items.previous_owners     IS 'Known chain of ownership prior to current owner';
COMMENT ON COLUMN public.collection_items.event_details       IS 'Game, event, or occasion associated with the item';
COMMENT ON COLUMN public.collection_items.supporting_evidence IS 'Letters of authenticity, photos, receipts, or other documentation';
