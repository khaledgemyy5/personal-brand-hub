# Supabase Database Setup

This folder contains documentation for the Ammar Resume site database.

## Migration Files

SQL files are located in `docs/sql/`:

| File | Description |
|------|-------------|
| `docs/sql/001_schema.sql` | ENUM types and table definitions |
| `docs/sql/002_rls.sql` | Row Level Security policies |
| `docs/sql/003_seed.sql` | Demo/seed data |

## Setup Instructions

### 1. Create Supabase Project

If using Lovable Cloud:
- Cloud will automatically provision a Supabase project
- Skip to step 3

If using external Supabase:
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning

### 2. Run Migrations

**Option A: Supabase Dashboard (Recommended for beginners)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   - First: `001_schema.sql`
   - Second: `002_rls.sql`
   - Third: `003_seed.sql`

**Option B: Supabase CLI**

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Create Admin User

1. Go to **Authentication** > **Users** in Supabase dashboard
2. Click **Add User** > **Create new user**
3. Enter your admin email and password
4. Copy the user's UUID from the table

### 4. Set Admin User ID

Run this SQL in the SQL Editor (replace with your actual UUID):

```sql
UPDATE site_settings 
SET admin_user_id = 'paste-your-actual-user-uuid-here'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
```

⚠️ **IMPORTANT**: Without setting the correct `admin_user_id`, you won't be able to manage content!

### 5. Configure Environment Variables

Add these to your `.env` file (get values from Supabase dashboard > Settings > API):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Security Notes

### Row Level Security (RLS)

All tables have RLS enabled with these access patterns:

| Table | Public Read | Public Write | Admin Read | Admin Write |
|-------|-------------|--------------|------------|-------------|
| `site_settings` | ✅ | ❌ | ✅ | ✅ |
| `projects` | ✅ (published only) | ❌ | ✅ (all) | ✅ |
| `writing_categories` | ✅ (enabled only) | ❌ | ✅ (all) | ✅ |
| `writing_items` | ✅ (enabled only) | ❌ | ✅ (all) | ✅ |
| `analytics_events` | ❌ | ✅ | ✅ | ✅ |

### Admin Detection

Admin access is determined by matching `auth.uid()` with `site_settings.admin_user_id`. This means:

1. Only ONE user can be admin
2. The admin must be set via direct database update (not exposed in UI)
3. RLS policies use a security-definer function to avoid recursion

## Schema Reference

### ENUM Types

```sql
project_status: 'PUBLIC' | 'CONFIDENTIAL' | 'CONCEPT'
detail_level: 'BRIEF' | 'STANDARD' | 'DEEP'
writing_language: 'AUTO' | 'AR' | 'EN'
```

### Tables

**site_settings** (singleton)
- `admin_user_id` - Links to auth.users, determines admin access
- `nav_config` - Navigation menu configuration
- `home_sections` - Homepage section order and visibility
- `theme` - Theme preferences
- `seo` - SEO meta tags
- `pages` - Page-specific settings (resume PDF, contact form, etc.)

**projects**
- `slug` - URL-friendly identifier
- `status` - PUBLIC/CONFIDENTIAL/CONCEPT
- `detail_level` - Controls how much info to show
- `sections_config` - Which sections appear on detail page
- `content` - Actual content blocks (JSON)

**writing_categories**
- Simple category grouping for writing items

**writing_items**
- `language` - AUTO detects from title, or force AR/EN
- `why_this_matters` - Optional context paragraph
- `show_why` - Toggle for showing context

**analytics_events**
- Privacy-friendly event tracking
- `sid` - Anonymous session ID (not tied to user)

## Troubleshooting

### "permission denied" errors

1. Check that RLS is enabled (it should be by default)
2. Verify `admin_user_id` is correctly set in `site_settings`
3. Ensure you're logged in when accessing admin features

### Can't see published content

1. Check that `published = true` on projects
2. Check that `enabled = true` on writing items AND their category
3. Verify RLS policies were applied (run `002_rls.sql` again if needed)

### Admin can't edit content

1. Verify `auth.uid()` matches `site_settings.admin_user_id`
2. Check browser console for auth errors
3. Try logging out and back in

## Backup & Migration

To export your data:

```sql
-- Export as JSON (run in SQL Editor)
SELECT json_agg(t) FROM projects t;
SELECT json_agg(t) FROM writing_categories t;
SELECT json_agg(t) FROM writing_items t;
```

To reset and re-seed:

```sql
-- ⚠️ DESTRUCTIVE - deletes all data!
TRUNCATE projects, writing_items, writing_categories CASCADE;
-- Then re-run 003_seed.sql
```
