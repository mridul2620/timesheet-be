const http = require('http');

const API_BASE = 'http://localhost:3001/api';

async function testUnauthenticatedAccess(endpoint, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(API_BASE + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint,
          method,
          statusCode: res.statusCode,
          // If it's a 200 or 201 without a token, it's vulnerable!
          vulnerable: res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204
        });
      });
    });

    req.on('error', (e) => {
      resolve({ endpoint, method, error: e.message, vulnerable: false });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log("Starting Security & Authentication Audit...\n");
  
  const endpointsToTest = [
    { path: '/users', method: 'GET' },
    { path: '/timesheet/submit', method: 'POST', body: { username: 'test', weekStartDate: '2026-05-01', entries: [], workDescription: 'hacked' } },
    { path: '/payroll', method: 'POST', body: { username: 'test', name: 'Test', timePeriod: 'May 2026', payrate: 100, netPay: 1000, totalTime: 10, workingDays: 1 } },
    { path: '/clients', method: 'GET' },
    { path: '/projects', method: 'GET' },
    { path: '/subjects', method: 'GET' },
    { path: '/holidays', method: 'GET' }, // Check if this exists
    { path: '/deleteUser', method: 'DELETE', body: { username: 'nonexistent' } }, // Testing if it processes the request
  ];

  let vulnerableCount = 0;
  
  for (const test of endpointsToTest) {
    const result = await testUnauthenticatedAccess(test.path, test.method, test.body);
    const statusStr = result.vulnerable ? '❌ VULNERABLE' : '✅ SECURE';
    if (result.vulnerable) vulnerableCount++;
    console.log(`${statusStr} | ${test.method} ${test.path} | Status: ${result.statusCode}`);
  }

  console.log(`\nAudit Complete. Found ${vulnerableCount} critically vulnerable endpoints lacking authentication.`);
}

runAudit();
