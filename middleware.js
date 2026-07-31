import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis and Ratelimit only if the env vars exist (safe fallback)
let ratelimit;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'), // Limit: 10 requests per 10 seconds per IP
      analytics: true,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Upstash Redis Ratelimit:', error);
}

import { updateSession } from './lib/supabaseMiddleware';

export async function middleware(request) {
  // 1. Run the Supabase Auth update logic
  const authResponse = await updateSession(request);

  // If Redis is not configured or this is not an API route, just return the auth response
  if (!ratelimit || !request.nextUrl.pathname.startsWith('/api')) {
    return authResponse;
  }

  // Extract the IP address from the request
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = request.ip ?? (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1');

  // Apply rate limiting
  let limitResult;
  try {
    limitResult = await ratelimit.limit(`ratelimit_${ip}`);
  } catch (err) {
    console.error('Redis Rate Limit Exception, failing open:', err);
    return authResponse; // Fail open
  }
  const { success, limit, reset, remaining } = limitResult;

  if (!success) {
    return new NextResponse(
      JSON.stringify({ error: 'Too Many Requests. Please slow down and try again later.' }), 
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
