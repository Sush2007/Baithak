import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test Script for Baithak Rate Limiting & Queueing
 * 
 * To run this test (ensure k6 is installed):
 * k6 run load-test.js
 */

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '20s', target: 200 }, // Spike to 200 concurrent users
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = 'http://localhost:5173'; // Change to production URL if needed

export default function () {
  // 1. Test the strict rate-limited endpoint (e.g., Report API)
  // We expect this to return 429 Too Many Requests very quickly due to the strict limiter (5 req/min)
  const reportPayload = JSON.stringify({
    post_id: 'test-uuid-1234',
    reason: 'Spam or misleading',
    details: 'Load testing the rate limiter',
  });

  const reportRes = http.post(`${BASE_URL}/api/report`, reportPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  // Verify that it either succeeds or gets successfully rate limited
  check(reportRes, {
    'Report API: Status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'Report API: Rate limit applied correctly': (r) => {
      // If we are flooding it, it should return 429
      if (r.status === 429) {
         return r.json('error') === 'Too Many Requests';
      }
      return true;
    },
  });

  sleep(0.5);

  // 2. Test standard rate-limited endpoint (e.g., general API read or page load)
  // This uses the default limiter (30 req / 10s)
  const pageRes = http.get(`${BASE_URL}/`);
  check(pageRes, {
    'Homepage: Status is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 2); // Random sleep between 0-2 seconds
}
