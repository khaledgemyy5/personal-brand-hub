-- =============================================================================
-- Migration 003: Seed Data
-- =============================================================================

-- ⚠️ IMPORTANT: Replace admin_user_id after creating your admin user!
-- See README.md for instructions.

-- Site Settings (singleton row)
INSERT INTO site_settings (
  id, admin_user_id, nav_config, home_sections, theme, seo, pages
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', -- ⚠️ REPLACE with actual admin UUID
  '{
    "links": [
      {"href": "/", "label": "Home", "visible": true},
      {"href": "/projects", "label": "Projects", "visible": true},
      {"href": "/writing", "label": "Writing", "visible": true},
      {"href": "/contact", "label": "Contact", "visible": true}
    ],
    "ctaButton": {"href": "/resume", "label": "Resume", "visible": true}
  }'::jsonb,
  '{
    "sections": [
      {"id": "hero", "visible": true, "order": 1},
      {"id": "experience_snapshot", "visible": true, "order": 2},
      {"id": "featured_projects", "visible": true, "order": 3, "limit": 3},
      {"id": "how_i_work", "visible": true, "order": 4},
      {"id": "selected_writing_preview", "visible": true, "order": 5, "limit": 3},
      {"id": "contact_cta", "visible": true, "order": 6}
    ]
  }'::jsonb,
  '{"mode": "system", "accentColor": "#135BEC", "font": "inter"}'::jsonb,
  '{"title": "Ammar Jaber", "description": "Technical Product Manager (ex-LLM / Software Engineer)"}'::jsonb,
  '{
    "resume": {"enabled": true, "pdfUrl": null},
    "contact": {"enabled": true, "email": "hello@example.com"}
  }'::jsonb
);

-- Demo Projects
INSERT INTO projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, media, metrics, decision_log) VALUES
(
  'distributed-task-scheduler',
  'Distributed Task Scheduler',
  'A high-performance distributed task scheduling system built for processing millions of jobs daily.',
  ARRAY['Go', 'Redis', 'Kubernetes', 'gRPC'],
  'PUBLIC',
  'DEEP',
  true,
  true,
  '{"showOverview": true, "showChallenge": true, "showApproach": true, "showOutcome": true}'::jsonb,
  '{"overview": "Designed and implemented a distributed task scheduling system capable of handling 5M+ daily jobs.", "challenge": "The existing monolithic job queue was hitting performance limits.", "approach": "Built a new architecture using Go for the core scheduler, Redis for distributed locking.", "outcome": "Reduced job processing latency by 60%, achieved 99.99% uptime."}'::jsonb,
  '[]'::jsonb,
  '["5M+ daily jobs processed", "60% latency reduction", "99.99% uptime"]'::jsonb,
  '[{"decision": "Chose Redis over Kafka for job queue", "tradeoff": "Simpler ops vs. guaranteed delivery", "outcome": "Redis persistence + retry logic achieved reliability goals"}]'::jsonb
),
(
  'fintech-payment-platform',
  'Enterprise Payment Platform',
  'Led development of a PCI-compliant payment processing platform handling $2B+ in annual transactions.',
  ARRAY['Java', 'Spring Boot', 'PostgreSQL', 'AWS'],
  'CONFIDENTIAL',
  'BRIEF',
  false,
  true,
  '{"showOverview": true, "showOutcome": true}'::jsonb,
  '{"overview": "Architected and led a team of 8 engineers to rebuild the core payment processing infrastructure.", "outcome": "Successfully migrated 100% of transaction volume with zero downtime.", "note": "Due to confidentiality agreements, technical details cannot be disclosed."}'::jsonb,
  '[]'::jsonb,
  '["$2B+ annual transactions", "Zero downtime migration", "PCI-DSS compliant"]'::jsonb,
  '[]'::jsonb
);

-- Demo Writing Category
INSERT INTO writing_categories (id, name, order_index, enabled) VALUES
('b0000000-0000-0000-0000-000000000001', 'Technical Articles', 1, true);

-- Demo Writing Items
INSERT INTO writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index, why_this_matters, show_why) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'Building Resilient Distributed Systems: Lessons from Production',
  'https://medium.com/example/distributed-systems-lessons',
  'Medium',
  'EN',
  true,
  true,
  1,
  'This piece synthesizes 5 years of experience running large-scale systems.',
  true
),
(
  'b0000000-0000-0000-0000-000000000001',
  'مقدمة في هندسة البرمجيات للمبتدئين',
  'https://example.com/arabic-tech-intro',
  'Personal Blog',
  'AR',
  false,
  true,
  2,
  'Written to address the lack of quality Arabic resources for aspiring software engineers.',
  true
);

-- -----------------------------------------------------------------------------
-- After creating admin user in Supabase Auth, run:
-- UPDATE site_settings SET admin_user_id = 'your-actual-uuid' WHERE id = 'a0000000-0000-0000-0000-000000000001';
-- -----------------------------------------------------------------------------
