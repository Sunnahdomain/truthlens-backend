import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import corsMiddleware from "./middleware/cors";
import { rateLimiter, authRateLimiter } from "./middleware/rate-limiter";
import { seedDatabase } from "./utils/seed";

// Import API route handlers
import articlesRouter from "./api/articles";
import topicsRouter from "./api/topics";
import analyticsRouter from "./api/analytics";
import versionsRouter from "./api/versions";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global middleware
  app.use(corsMiddleware);
  
  // Apply rate limiting to auth endpoints
  app.use(['/api/login', '/api/register'], authRateLimiter.middleware());
  
  // Apply general rate limiting to all other API endpoints
  app.use('/api', rateLimiter.middleware());
  
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Register API routes
  app.use('/api/topics', topicsRouter);
  app.use('/api/articles', articlesRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/articles', versionsRouter); // For version-related endpoints
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Initialize database with seed data
  await seedDatabase();
  
  const httpServer = createServer(app);

  return httpServer;
}
