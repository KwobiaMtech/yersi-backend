#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
}

class TestRunner {
  private results: TestResult[] = [];

  async runTest(name: string, command: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running ${name}...`);
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
      
      const duration = Date.now() - startTime;
      const result: TestResult = { name, status: 'PASS', duration };
      this.results.push(result);
      
      console.log(`✅ ${name} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = { 
        name, 
        status: 'FAIL', 
        duration, 
        error: error.message 
      };
      this.results.push(result);
      
      console.log(`❌ ${name} failed after ${duration}ms`);
      console.error(error.message);
      return result;
    }
  }

  generateReport(): void {
    console.log('\n📊 TEST EXECUTION REPORT');
    console.log('========================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    
    console.log('\nDetailed Results:');
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.name} (${result.duration}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Save report to file
    const reportPath = path.join(__dirname, '../test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: { totalTests, passedTests, failedTests, totalDuration },
      results: this.results,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive E2E Test Suite');
    console.log('=========================================');

    // Check if MongoDB is available
    try {
      execSync('mongod --version', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  MongoDB not found, using in-memory database');
    }

    // Run different test suites
    const testSuites = [
      {
        name: 'Unit Tests',
        command: 'npm run test -- --passWithNoTests'
      },
      {
        name: 'Basic E2E Tests',
        command: 'npm run test:e2e'
      },
      {
        name: 'Complete E2E Flow',
        command: 'npm run test:e2e:complete'
      },
      {
        name: 'Modular E2E Tests',
        command: 'npm run test:e2e:modules'
      }
    ];

    for (const suite of testSuites) {
      await this.runTest(suite.name, suite.command);
    }

    this.generateReport();
    
    const failedCount = this.results.filter(r => r.status === 'FAIL').length;
    if (failedCount > 0) {
      console.log(`\n❌ ${failedCount} test suite(s) failed`);
      process.exit(1);
    } else {
      console.log('\n🎉 All test suites passed!');
      process.exit(0);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };
