#!/usr/bin/env node
/**
 * Lightweight smoke test script
 * Tests that key pages load without errors
 * 
 * Usage: node scripts/smoke-test.mjs [base-url]
 * Default: http://localhost:8080
 */

const BASE_URL = process.argv[2] || 'http://localhost:8080';

const tests = [
  {
    name: 'Home page loads',
    path: '/',
    check: (html) => html.includes('</html>') && !html.includes('Application error'),
  },
  {
    name: 'Projects page loads',
    path: '/projects',
    check: (html) => html.includes('</html>') && !html.includes('Application error'),
  },
  {
    name: 'Writing page loads',
    path: '/writing',
    check: (html) => html.includes('</html>') && !html.includes('Application error'),
  },
  {
    name: 'Admin redirects or shows login',
    path: '/admin',
    check: (html) => {
      // Should either redirect to login or show login/setup page
      return html.includes('</html>') && !html.includes('Application error');
    },
  },
  {
    name: '404 page works',
    path: '/nonexistent-page-12345',
    check: (html) => html.includes('</html>'),
  },
];

async function runTests() {
  console.log(`\n🧪 Smoke Tests - ${BASE_URL}\n`);
  console.log('─'.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const url = `${BASE_URL}${test.path}`;
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'SmokeTest/1.0',
        },
      });

      const html = await response.text();
      const ok = test.check(html);

      if (ok && response.status < 500) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} (status: ${response.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} (${error.message})`);
      failed++;
    }
  }

  console.log('─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Smoke test failed:', error);
  process.exit(1);
});
