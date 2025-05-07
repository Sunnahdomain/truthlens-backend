import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
// In production you would use a Redis-based solution
export class RateLimiter {
  private requests: Map<string, { count: number, resetTime: number }> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxRequests: number, timeWindowInSeconds: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowInSeconds * 1000;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  public middleware(customMaxRequests?: number, customTimeWindow?: number) {
    const maxRequests = customMaxRequests || this.maxRequests;
    const timeWindow = customTimeWindow ? customTimeWindow * 1000 : this.timeWindow;

    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${ip}:${req.path}`;
      const now = Date.now();
      
      // Get or initialize request data
      const requestData = this.requests.get(key) || { count: 0, resetTime: now + timeWindow };
      
      // If the time window has expired, reset the counter
      if (now > requestData.resetTime) {
        requestData.count = 0;
        requestData.resetTime = now + timeWindow;
      }
      
      // Increment request count
      requestData.count++;
      this.requests.set(key, requestData);
      
      // Check if request limit is exceeded
      if (requestData.count > maxRequests) {
        const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          message: 'Too many requests, please try again later.',
          retryAfter
        });
      }
      
      next();
    };
  }
}

// Create default rate limiter instance
// 100 requests per minute for general API endpoints
export const rateLimiter = new RateLimiter(100, 60);

// More restrictive limiter for authentication endpoints
// 10 requests per minute
export const authRateLimiter = new RateLimiter(10, 60);
