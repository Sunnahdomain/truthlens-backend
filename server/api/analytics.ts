import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../auth';
import { 
  insertArticleViewSchema, 
  insertArticleBounceSchema, 
  insertSocialShareSchema 
} from '@shared/schema';
import { ZodError } from 'zod';

const router = Router();

// Record an article view
router.post('/view', async (req: Request, res: Response) => {
  try {
    const viewData = insertArticleViewSchema.parse({
      ...req.body,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer
    });
    
    const view = await storage.recordArticleView(viewData);
    res.status(201).json(view);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid view data', errors: error.errors });
    }
    console.error('Error recording view:', error);
    res.status(500).json({ message: 'Failed to record view' });
  }
});

// Record an article bounce
router.post('/bounce', async (req: Request, res: Response) => {
  try {
    const bounceData = insertArticleBounceSchema.parse({
      ...req.body,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer
    });
    
    const bounce = await storage.recordArticleBounce(bounceData);
    res.status(201).json(bounce);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid bounce data', errors: error.errors });
    }
    console.error('Error recording bounce:', error);
    res.status(500).json({ message: 'Failed to record bounce' });
  }
});

// Record a social share
router.post('/share', async (req: Request, res: Response) => {
  try {
    const shareData = insertSocialShareSchema.parse({
      ...req.body,
      userId: req.user?.id
    });
    
    const share = await storage.recordSocialShare(shareData);
    res.status(201).json(share);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid share data', errors: error.errors });
    }
    console.error('Error recording share:', error);
    res.status(500).json({ message: 'Failed to record share' });
  }
});

// Get analytics overview (admin only)
router.get('/overview', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (start_date) {
      startDate = new Date(start_date as string);
    }
    
    if (end_date) {
      endDate = new Date(end_date as string);
    }
    
    const stats = await storage.getOverviewStats(startDate, endDate);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ message: 'Failed to fetch analytics overview' });
  }
});

// Get top articles (admin only)
router.get('/articles', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (start_date) {
      startDate = new Date(start_date as string);
    }
    
    if (end_date) {
      endDate = new Date(end_date as string);
    }
    
    const stats = await storage.getOverviewStats(startDate, endDate);
    res.json(stats.topArticles);
  } catch (error) {
    console.error('Error fetching top articles:', error);
    res.status(500).json({ message: 'Failed to fetch top articles' });
  }
});

// Get specific article stats (admin only)
router.get('/article/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { start_date, end_date } = req.query;
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (start_date) {
      startDate = new Date(start_date as string);
    }
    
    if (end_date) {
      endDate = new Date(end_date as string);
    }
    
    const stats = await storage.getArticleStats(id, startDate, endDate);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching article stats:', error);
    res.status(500).json({ message: 'Failed to fetch article stats' });
  }
});

// Record a bookmark (similar to view but can be tracked separately)
router.post('/bookmark', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // For bookmarks, we reuse the social shares system
    const bookmarkData = insertSocialShareSchema.parse({
      articleId: req.body.articleId,
      platform: 'bookmark',
      userId: req.user?.id
    });
    
    const bookmark = await storage.recordSocialShare(bookmarkData);
    res.status(201).json(bookmark);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid bookmark data', errors: error.errors });
    }
    console.error('Error recording bookmark:', error);
    res.status(500).json({ message: 'Failed to record bookmark' });
  }
});

export default router;
