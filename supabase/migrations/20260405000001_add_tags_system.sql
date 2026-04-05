-- Tags system: many-to-many relationship between items and user-owned tags.
-- Tags are normalized to lowercase hyphenated strings before storage.
-- See TagInput component for client-side normalization logic.

-- ── tags ─────────────────────────────────────────────────────────────────────
-- One row per unique (user_id, name) pair. The unique constraint allows safe
-- upsert on (user_id, name) to get-or-create tags on every write.

create table public.tags (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now(),
  constraint tags_user_id_name_key unique (user_id, name)
);

comment on table  public.tags           is 'User-owned normalized tag names.';
comment on column public.tags.name      is 'Lowercase hyphenated slug, e.g. "tom-brady".';
comment on column public.tags.user_id   is 'Owner — tags are private per-user.';

-- ── item_tags ─────────────────────────────────────────────────────────────────
-- Join table. user_id is denormalized here so RLS policies can filter without
-- an extra join to collection_items or tags.

create table public.item_tags (
  item_id    uuid        not null references public.collection_items(id) on delete cascade,
  tag_id     uuid        not null references public.tags(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, tag_id)
);

comment on table  public.item_tags         is 'Many-to-many join between collection_items and tags.';
comment on column public.item_tags.user_id is 'Denormalized owner for RLS performance.';

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.tags      enable row level security;
alter table public.item_tags enable row level security;

create policy "Users can manage their own tags"
  on public.tags for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own item_tags"
  on public.item_tags for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- idx_tags_user_id:       per-user tag lookups and unique constraint support
-- idx_item_tags_item_id:  fetching all tags for a given item
-- idx_item_tags_user_id:  bulk-loading all tags for a user's entire collection

create index idx_tags_user_id      on public.tags(user_id);
create index idx_item_tags_item_id on public.item_tags(item_id);
create index idx_item_tags_user_id on public.item_tags(user_id);
