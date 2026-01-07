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
  _settings_updated boolean := false;
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
  -- UPDATE SITE SETTINGS (idempotent - only updates if defaults)
  -- ==========================================================================
  
  UPDATE public.site_settings
  SET 
    nav_config = jsonb_build_object(
      'links', jsonb_build_array(
        jsonb_build_object('href', '/', 'label', 'Home', 'visible', true),
        jsonb_build_object('href', '/projects', 'label', 'Projects', 'visible', true),
        jsonb_build_object('href', '/writing', 'label', 'Writing', 'visible', true),
        jsonb_build_object('href', '/contact', 'label', 'Contact', 'visible', true)
      ),
      'ctaButton', jsonb_build_object('href', '/resume', 'label', 'Resume', 'visible', true)
    ),
    home_sections = jsonb_build_object(
      'sections', jsonb_build_array(
        jsonb_build_object('id', 'hero', 'visible', true, 'order', 1),
        jsonb_build_object('id', 'experience_snapshot', 'visible', true, 'order', 2),
        jsonb_build_object('id', 'featured_projects', 'visible', true, 'order', 3, 'limit', 3),
        jsonb_build_object('id', 'how_i_work', 'visible', true, 'order', 4),
        jsonb_build_object('id', 'selected_writing_preview', 'visible', true, 'order', 5, 'limit', 3),
        jsonb_build_object('id', 'contact_cta', 'visible', true, 'order', 6)
      )
    ),
    theme = jsonb_build_object('mode', 'system', 'font', 'inter', 'accentColor', '#135BEC'),
    seo = jsonb_build_object(
      'title', 'Ammar Jaber',
      'description', 'Technical Product Manager (ex-LLM / Software Engineer) - Building products that matter.',
      'faviconUrl', null
    ),
    pages = jsonb_build_object(
      'resume', jsonb_build_object(
        'enabled', true,
        'pdfUrl', null,
        'showCopyText', true,
        'showDownload', true
      ),
      'contact', jsonb_build_object(
        'enabled', true,
        'showForm', false,
        'email', 'hello@ammar.dev',
        'linkedin', 'https://linkedin.com/in/ammarjaber',
        'calendar', 'https://cal.com/ammar'
      ),
      'writing', jsonb_build_object(
        'enabled', true,
        'autoHideIfEmpty', true
      ),
      'methodology', ARRAY[
        'Start with the problem, not the solution',
        'Ship early, iterate based on feedback',
        'Write documentation as you build',
        'Automate repetitive tasks',
        'Prioritize maintainability over cleverness'
      ]
    )
  WHERE nav_config = '{"links":[],"ctaButton":{"visible":false,"href":"/resume","label":"Resume"}}'::jsonb
     OR nav_config->'links' = '[]'::jsonb;
  
  IF FOUND THEN
    _settings_updated := true;
  END IF;

  -- ==========================================================================
  -- SEED PROJECTS (idempotent - only insert if slug doesn't exist)
  -- ==========================================================================
  
  INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, media, metrics, decision_log)
  SELECT * FROM (VALUES
    (
      'ai-product-assistant',
      'AI Product Assistant',
      'Built an internal AI-powered tool that helps product managers write better user stories and PRDs, reducing documentation time by 40%.',
      ARRAY['AI', 'LLM', 'Product'],
      'PUBLIC',
      'STANDARD',
      true,
      true,
      '{"showOverview": true, "showChallenge": true, "showApproach": true, "showOutcome": true, "showImages": false, "maxImages": 3}'::jsonb,
      '{
        "overview": "Developed an AI assistant that streamlines product documentation by suggesting improvements, identifying gaps, and ensuring consistency across user stories. The tool integrates with existing workflows and learns from company-specific context.",
        "context": "Product teams were spending 2+ hours per sprint refining documentation. We needed a faster, more consistent approach that still maintained quality.",
        "problem": "Documentation quality varied significantly across teams, leading to implementation misunderstandings and costly rework during development sprints.",
        "your_role": "Led the project from concept to launch, including prompt engineering, RAG pipeline design, and integration with existing tools like Jira and Confluence.",
        "approach_decisions": "Chose a retrieval-augmented generation (RAG) approach to ground suggestions in company context. Built custom embeddings from historical PRDs and user stories.",
        "execution": "Started with a CLI prototype, validated with 3 PM teams, then built a Slack integration. Iterated based on feedback for 6 weeks before company-wide rollout.",
        "impact": "Reduced documentation time by 40% and improved first-pass acceptance rate from 60% to 85%. Now used by 12 product teams daily.",
        "learnings": "Prompt engineering is an iterative process. User feedback on AI suggestions was crucial for improving output quality.",
        "links": {"live": null, "github": null}
      }'::jsonb,
      '[]'::jsonb,
      '["40% reduction in doc time", "85% first-pass acceptance", "Adopted by 12 teams", "6 week iteration cycle"]'::jsonb,
      '[
        {"decision": "Use RAG over fine-tuning", "tradeoff": "More complex pipeline but better accuracy with company context", "outcome": "Suggestions were 3x more relevant than generic LLM output"},
        {"decision": "Slack-first integration", "tradeoff": "Limited formatting vs dedicated UI", "outcome": "Higher adoption due to lower friction"}
      ]'::jsonb
    ),
    (
      'enterprise-analytics-platform',
      'Enterprise Analytics Platform',
      'Confidential project for a Fortune 500 client involving real-time data visualization and predictive analytics.',
      ARRAY['Engineering', 'Platform', 'Data'],
      'CONFIDENTIAL',
      'BRIEF',
      false,
      true,
      '{"showOverview": true, "showChallenge": false, "showApproach": false, "showOutcome": true, "showImages": false, "maxImages": 0}'::jsonb,
      '{
        "overview": "Built a real-time analytics dashboard processing millions of events daily, enabling data-driven decisions across the organization.",
        "impact": "Platform now serves 500+ daily active users and processes over 1M events per day with sub-second query response times.",
        "note": "Details limited due to NDA. This project involved sensitive financial data and required SOC 2 compliance.",
        "links": {}
      }'::jsonb,
      '[]'::jsonb,
      '["500+ daily active users", "1M+ events/day", "Sub-second queries", "SOC 2 compliant"]'::jsonb,
      '[]'::jsonb
    ),
    (
      'voice-notes-concept',
      'Voice Notes App',
      'A concept design for a voice-first note-taking app with AI transcription, automatic tagging, and smart organization.',
      ARRAY['Startups', 'Product', 'Mobile'],
      'CONCEPT',
      'STANDARD',
      false,
      true,
      '{"showOverview": true, "showChallenge": true, "showApproach": true, "showOutcome": true, "showImages": false, "maxImages": 2}'::jsonb,
      '{
        "overview": "Explored the idea of a voice-first note app that automatically transcribes, tags, and organizes voice memos using AI. Designed for busy professionals who think better out loud.",
        "context": "Many people struggle with traditional note-taking apps. Voice notes are faster to capture but harder to organize and search.",
        "problem": "Existing voice memo apps lack smart organization. Users end up with hundreds of untitled recordings they never revisit.",
        "approach_decisions": "Designed with offline-first architecture and end-to-end encryption. AI processing happens on-device where possible, with cloud fallback for complex transcription.",
        "impact": "Concept validated through 15 user interviews. 80% said they would pay for this solution. Currently seeking co-founder to build MVP.",
        "learnings": "Voice UI requires different mental models than text-based apps. Users expect near-instant feedback on transcription.",
        "links": {}
      }'::jsonb,
      '[]'::jsonb,
      '["15 user interviews", "80% willingness to pay", "Offline-first design"]'::jsonb,
      '[
        {"decision": "Offline-first architecture", "tradeoff": "More complex sync logic but better privacy and reliability", "outcome": "Users trusted the app more with sensitive notes"}
      ]'::jsonb
    )
  ) AS v(slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, media, metrics, decision_log)
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
      'https://medium.com/@ammar/rate-limiting-patterns',
      'Medium',
      'EN',
      true,
      true,
      1,
      'Essential patterns for production systems handling variable load. Covers token bucket, sliding window, and distributed rate limiting strategies.',
      true
    ),
    (
      'w0000002-0000-0000-0000-000000000002'::uuid,
      'c0000001-0000-0000-0000-000000000001'::uuid,
      'TypeScript Patterns for React Applications',
      'https://github.com/ammar/typescript-react-patterns',
      'GitHub',
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
      'https://linkedin.com/pulse/user-stories-ammar',
      'LinkedIn',
      'EN',
      true,
      true,
      1,
      'Bridge the gap between product vision and implementation. A practical guide to writing stories that are clear, testable, and actually get built correctly.',
      true
    ),
    (
      'w0000004-0000-0000-0000-000000000004'::uuid,
      'c0000003-0000-0000-0000-000000000003'::uuid,
      'مقدمة في إدارة المنتجات التقنية',
      'https://linkedin.com/pulse/intro-pm-arabic-ammar',
      'LinkedIn',
      'AR',
      true,
      true,
      1,
      'نظرة شاملة على أساسيات إدارة المنتجات للمهندسين الذين يريدون الانتقال إلى مجال المنتجات',
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
    'settings_updated', _settings_updated,
    'projects_inserted', _projects_inserted,
    'categories_inserted', _categories_inserted,
    'items_inserted', _items_inserted
  );
END;
$$;

-- Grant execute to authenticated users (function checks is_admin internally)
GRANT EXECUTE ON FUNCTION public.admin_seed_demo() TO authenticated;

COMMENT ON FUNCTION public.admin_seed_demo() IS 'Seeds demo content for site settings, projects, and writing. Only works for admin users. Idempotent - safe to run multiple times.';
