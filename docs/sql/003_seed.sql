-- =============================================================================
-- Admin Seed Demo Content Function
-- Run this AFTER 000_all.sql and AFTER claiming admin
-- This creates an idempotent RPC function that only admins can call
-- =============================================================================

-- Drop if exists for re-runnability
DROP FUNCTION IF EXISTS public.admin_seed_demo();

-- Create the seed function
CREATE OR REPLACE FUNCTION public.admin_seed_demo()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
  _is_admin boolean;
  _projects_inserted int := 0;
  _categories_inserted int := 0;
  _items_inserted int := 0;
BEGIN
  -- Check caller is authenticated
  _caller := auth.uid();
  IF _caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check caller is admin
  SELECT public.is_admin() INTO _is_admin;
  IF NOT _is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- ==========================================================================
  -- SEED PROJECTS (idempotent - only insert if slug doesn't exist)
  -- ==========================================================================
  
  INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, content, media, metrics)
  SELECT * FROM (VALUES
    (
      'ai-product-assistant',
      'AI Product Assistant',
      'Built an internal AI-powered tool that helps product managers write better user stories and PRDs.',
      ARRAY['AI', 'Product Management', 'LLM'],
      'PUBLIC',
      'STANDARD',
      true,
      true,
      '{"overview": "Developed an AI assistant that streamlines product documentation by suggesting improvements, identifying gaps, and ensuring consistency across user stories.", "context": "Product teams were spending 2+ hours per sprint refining documentation. We needed a faster, more consistent approach.", "problem": "Documentation quality varied significantly across teams, leading to implementation misunderstandings.", "your_role": "Led the project from concept to launch, including prompt engineering and integration with existing tools.", "approach_decisions": "Chose a retrieval-augmented generation (RAG) approach to ground suggestions in company context.", "impact": "Reduced documentation time by 40% and improved first-pass acceptance rate from 60% to 85%.", "links": {"live": null, "github": null}}'::jsonb,
      '[]'::jsonb,
      '["40% reduction in doc time", "85% first-pass acceptance", "Adopted by 12 teams"]'::jsonb
    ),
    (
      'portfolio-cms',
      'Portfolio CMS',
      'A headless CMS for portfolio sites with support for projects, writing, and resume management.',
      ARRAY['React', 'Supabase', 'TypeScript'],
      'PUBLIC',
      'DEEP',
      true,
      true,
      '{"overview": "Full-stack portfolio management system with admin dashboard, public-facing pages, and analytics.", "context": "Needed a flexible system to manage my own portfolio without relying on third-party platforms.", "problem": "Existing solutions were either too rigid or required too much maintenance.", "your_role": "Solo developer - designed, built, and deployed the entire system.", "constraints": "Must be self-hostable, require minimal infrastructure, and have zero vendor lock-in.", "approach_decisions": "Chose Supabase for backend to get auth, database, and storage in one package.", "execution": "Built iteratively over 3 weeks, starting with core project management then adding writing and resume features.", "impact": "Successfully running my portfolio with full control over design and content.", "learnings": "RLS policies require careful planning upfront. Bootstrap flows need security consideration.", "links": {"github": "https://github.com/example/portfolio-cms"}}'::jsonb,
      '[]'::jsonb,
      '["3 week development", "Zero monthly cost", "Full data ownership"]'::jsonb
    ),
    (
      'enterprise-dashboard',
      'Enterprise Analytics Dashboard',
      'Confidential project for a Fortune 500 client involving real-time data visualization.',
      ARRAY['Data Viz', 'React', 'Enterprise'],
      'CONFIDENTIAL',
      'BRIEF',
      false,
      true,
      '{"overview": "Built a real-time analytics dashboard processing millions of events daily.", "impact": "Enabled data-driven decisions for 500+ users across the organization.", "note": "Details limited due to NDA.", "links": {}}'::jsonb,
      '[]'::jsonb,
      '["500+ daily active users", "1M+ events/day"]'::jsonb
    ),
    (
      'voice-note-app',
      'Voice Note Concept',
      'A concept design for a voice-first note-taking app with AI transcription and organization.',
      ARRAY['Mobile', 'AI', 'Concept'],
      'CONCEPT',
      'BRIEF',
      false,
      true,
      '{"overview": "Explored the idea of a voice-first note app that automatically transcribes, tags, and organizes voice memos using AI.", "approach_decisions": "Designed with offline-first architecture and end-to-end encryption in mind.", "impact": "Concept validated through user interviews but not yet implemented.", "links": {}}'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb
    )
  ) AS v(slug, title, summary, tags, status, detail_level, featured, published, content, media, metrics)
  WHERE NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.slug = v.slug);

  GET DIAGNOSTICS _projects_inserted = ROW_COUNT;

  -- ==========================================================================
  -- SEED WRITING CATEGORIES (idempotent)
  -- ==========================================================================
  
  INSERT INTO public.writing_categories (id, name, order_index, enabled)
  SELECT * FROM (VALUES
    ('c0000001-0000-0000-0000-000000000001'::uuid, 'Technical', 1, true),
    ('c0000002-0000-0000-0000-000000000002'::uuid, 'Product', 2, true),
    ('c0000003-0000-0000-0000-000000000003'::uuid, 'بالعربية', 3, true)
  ) AS v(id, name, order_index, enabled)
  WHERE NOT EXISTS (SELECT 1 FROM public.writing_categories c WHERE c.id = v.id);

  GET DIAGNOSTICS _categories_inserted = ROW_COUNT;

  -- ==========================================================================
  -- SEED WRITING ITEMS (idempotent)
  -- ==========================================================================
  
  INSERT INTO public.writing_items (id, category_id, title, url, platform_label, language, featured, enabled, order_index, why_this_matters, show_why)
  SELECT * FROM (VALUES
    (
      'w0000001-0000-0000-0000-000000000001'::uuid,
      'c0000001-0000-0000-0000-000000000001'::uuid,
      'Building Resilient APIs with Rate Limiting',
      'https://example.com/rate-limiting',
      'Medium',
      'EN',
      true,
      true,
      1,
      'Essential patterns for production systems handling variable load.',
      true
    ),
    (
      'w0000002-0000-0000-0000-000000000002'::uuid,
      'c0000001-0000-0000-0000-000000000001'::uuid,
      'TypeScript Patterns for React Applications',
      'https://example.com/typescript-react',
      'Dev.to',
      'EN',
      false,
      true,
      2,
      null,
      false
    ),
    (
      'w0000003-0000-0000-0000-000000000003'::uuid,
      'c0000002-0000-0000-0000-000000000002'::uuid,
      'Writing User Stories That Engineers Love',
      'https://example.com/user-stories',
      'LinkedIn',
      'EN',
      true,
      true,
      1,
      'Bridge the gap between product vision and implementation.',
      true
    ),
    (
      'w0000004-0000-0000-0000-000000000004'::uuid,
      'c0000003-0000-0000-0000-000000000003'::uuid,
      'مقدمة في إدارة المنتجات التقنية',
      'https://example.com/pm-arabic',
      'مدونة شخصية',
      'AR',
      true,
      true,
      1,
      'نظرة شاملة على أساسيات إدارة المنتجات للمهندسين',
      true
    )
  ) AS v(id, category_id, title, url, platform_label, language, featured, enabled, order_index, why_this_matters, show_why)
  WHERE NOT EXISTS (SELECT 1 FROM public.writing_items i WHERE i.id = v.id);

  GET DIAGNOSTICS _items_inserted = ROW_COUNT;

  -- ==========================================================================
  -- Return summary
  -- ==========================================================================
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Demo content seeded successfully',
    'projects_inserted', _projects_inserted,
    'categories_inserted', _categories_inserted,
    'items_inserted', _items_inserted
  );
END;
$$;

-- Grant execute to authenticated users (function checks is_admin internally)
GRANT EXECUTE ON FUNCTION public.admin_seed_demo() TO authenticated;

COMMENT ON FUNCTION public.admin_seed_demo() IS 'Seeds demo content for projects and writing. Only works for admin users. Idempotent - safe to run multiple times.';
