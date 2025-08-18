#!/usr/bin/env node
/**
 * Comprehensive test runner for song editor UI consistency and functionality
 * This script runs all critical tests that should pass before considering the app stable
 */

const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');

// Test suites to run in order
const testSuites = [
  {
    name: 'Song Editor UI Consistency',
    file: 'tests/e2e/features/test-song-editor-ui-consistency.spec.ts',
    description: 'Tests that song data displays correctly across all UI locations'
  },
  {
    name: 'Save Status Indicators',
    file: 'tests/e2e/features/test-save-status-indicators.spec.ts',
    description: 'Tests manual and auto-save status indicators work correctly'
  },
  {
    name: 'Metadata Display Consistency',
    file: 'tests/e2e/features/test-metadata-display-consistency.spec.ts',
    description: 'Tests song titles, artists, and metadata appear consistently'
  },
  {
    name: 'Stress Patterns Persistence',
    file: 'tests/e2e/features/test-stress-patterns-persistence.spec.ts',
    description: 'Tests stress analysis results are saved and restored correctly'
  }
];

async function runTest(testSuite) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running: ${testSuite.name}`);
    console.log(`📝 ${testSuite.description}`);
    console.log(`📁 ${testSuite.file}`);
    console.log('─'.repeat(80));

    const process = spawn('npx', ['playwright', 'test', testSuite.file], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testSuite.name} - PASSED`);
        resolve(true);
      } else {
        console.log(`❌ ${testSuite.name} - FAILED (exit code: ${code})`);
        resolve(false);
      }
    });

    process.on('error', (error) => {
      console.error(`💥 Error running ${testSuite.name}:`, error.message);
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive E2E Test Suite');
  console.log('📋 This test suite verifies critical UI functionality and data consistency');
  console.log('🎯 Purpose: Catch regressions before they impact development cycles');
  console.log('═'.repeat(80));

  const results = [];
  let totalTests = testSuites.length;
  let passedTests = 0;

  for (const testSuite of testSuites) {
    try {
      const passed = await runTest(testSuite);
      results.push({
        name: testSuite.name,
        file: testSuite.file,
        passed: passed
      });

      if (passed) {
        passedTests++;
      }
    } catch (error) {
      results.push({
        name: testSuite.name,
        file: testSuite.file,
        passed: false,
        error: error.message
      });
    }
  }

  // Summary Report
  console.log('\n' + '═'.repeat(80));
  console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('═'.repeat(80));

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`   💥 Error: ${result.error}`);
    }
  });

  console.log('─'.repeat(80));
  console.log(`📈 Overall Results: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);

  if (passedTests === totalTests) {
    console.log('🎉 All comprehensive tests PASSED! The app is in good shape.');
    console.log('✨ UI consistency and critical functionality verified.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests FAILED. These issues should be addressed before release:');

    results.filter(r => !r.passed).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.name} - Check logs above for details`);
    });

    console.log('\n💡 Tips for fixing issues:');
    console.log('   - Check browser console logs in test output');
    console.log('   - Look for screenshots in test-results/ directory');
    console.log('   - Run individual tests with --headed flag for debugging');
    console.log('   - Verify backend services are running properly');

    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🧪 Comprehensive E2E Test Runner');
  console.log('');
  console.log('Usage: node run-comprehensive-tests.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('  --list        List all test suites without running them');
  console.log('');
  console.log('Test Suites:');
  testSuites.forEach((suite, index) => {
    console.log(`  ${index + 1}. ${suite.name}`);
    console.log(`     ${suite.description}`);
    console.log(`     File: ${suite.file}`);
    console.log('');
  });
  process.exit(0);
}

if (process.argv.includes('--list')) {
  console.log('📋 Available Test Suites:');
  testSuites.forEach((suite, index) => {
    console.log(`\n${index + 1}. ${suite.name}`);
    console.log(`   📝 ${suite.description}`);
    console.log(`   📁 ${suite.file}`);
  });
  process.exit(0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Fatal error running comprehensive tests:', error);
  process.exit(1);
});
