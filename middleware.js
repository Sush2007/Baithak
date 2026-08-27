import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { updateSession } from './lib/supabaseMiddleware';

// Initialize Upstash Redis
let redis;
let defaultLimiter;
let strictLimiter;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
    
    // Default rate limit: 30 requests per 10 seconds per IP (for general API reads)
    defaultLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit/default'
    });

    // Strict rate limit: 5 requests per 60 seconds per IP (for sensitive writes/auth/reports)
    strictLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
      prefix: '@upstash/ratelimit/strict'
    });
  }
} catch (error) {
  console.warn('Failed to initialize Upstash Redis Ratelimit:', error);
}

export async function middleware(request) {
  // 1. Run the Supabase Auth update logic
  const authResponse = await updateSession(request);

  const { pathname } = request.nextUrl;

  // If Redis is not configured or this is not an API route, just return the auth response
  if (!redis || !pathname.startsWith('/api')) {
    return authResponse;
  }

  // Extract the IP address from the request
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = request.ip ?? (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1');

  // 2. Admission Control: Determine which limiter to use
  const isStrictRoute = 
    pathname.startsWith('/api/report') || 
    pathname.startsWith('/api/honor/award') || 
    pathname.startsWith('/api/admin');

  const limiter = isStrictRoute ? strictLimiter : defaultLimiter;

  // 3. Apply rate limiting
  let limitResult;
  try {
    limitResult = await limiter.limit(`ratelimit_${ip}`);
  } catch (err) {
    console.error('Redis Rate Limit Exception, failing open:', err);
    return authResponse; // Fail open to maintain availability during Redis outages
  }
  
  const { success, limit, reset, remaining } = limitResult;

  if (!success) {
    // 4. Graceful Client Response with standard 429 and Retry-After
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too Many Requests', 
        message: 'Rate limit exceeded. Please try again later.' 
      }), 
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfterSeconds.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful requests for client visibility
  authResponse.headers.set('X-RateLimit-Limit', limit.toString());
  authResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
  authResponse.headers.set('X-RateLimit-Reset', reset.toString());

  return authResponse;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
