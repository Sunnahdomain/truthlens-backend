import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../auth';
import { insertArticleVersionSchema } from '@shared/schema';
import { ZodError } from 'zod';

const router = Router();

// Get article version history
router.get('/:articleId/versions', async (req: Request, res: Response) => {
  try {
    const articleId = parseInt(req.params.articleId);
    const article = await storage.getArticle(articleId);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const versions = await storage.getArticleVersions(articleId);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching article versions:', error);
    res.status(500).json({ message: 'Failed to fetch article versions' });
  }
});

// Create a new article version
router.post('/:articleId/versions', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const articleId = parseInt(req.params.articleId);
    const article = await storage.getArticle(articleId);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Get current version number
    const versions = await storage.getArticleVersions(articleId);
    const latestVersion = versions[0]?.versionNumber || 0;
    
    // Create new version
    const versionData = insertArticleVersionSchema.parse({
      ...req.body,
      articleId,
      versionNumber: latestVersion + 1,
      createdById: req.user?.id
    });
    
    const newVersion = await storage.createArticleVersion(versionData);
    res.status(201).json(newVersion);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid version data', errors: error.errors });
    }
    console.error('Error creating article version:', error);
    res.status(500).json({ message: 'Failed to create article version' });
  }
});

// Get a specific article version
router.get('/:articleId/versions/:versionId', async (req: Request, res: Response) => {
  try {
    const articleId = parseInt(req.params.articleId);
    const versionId = parseInt(req.params.versionId);
    
    const article = await storage.getArticle(articleId);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const version = await storage.getArticleVersion(versionId);
    
    if (!version || version.articleId !== articleId) {
      return res.status(404).json({ message: 'Version not found for this article' });
    }
    
    res.json(version);
  } catch (error) {
    console.error('Error fetching article version:', error);
    res.status(500).json({ message: 'Failed to fetch article version' });
  }
});

// Restore a specific version
router.post('/:articleId/restore/:versionId', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const articleId = parseInt(req.params.articleId);
    const versionId = parseInt(req.params.versionId);
    
    const article = await storage.getArticle(articleId);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const version = await storage.getArticleVersion(versionId);
    
    if (!version || version.articleId !== articleId) {
      return res.status(404).json({ message: 'Version not found for this article' });
    }
    
    // Update article with version content
    const updatedArticle = await storage.updateArticle(articleId, {
      title: version.title,
      description: version.description,
      content: version.content,
    });
    
    // Get current version number
    const versions = await storage.getArticleVersions(articleId);
    const latestVersion = versions[0]?.versionNumber || 0;
    
    // Create new version to record the restoration
    await storage.createArticleVersion({
      articleId,
      title: version.title,
      description: version.description,
      content: version.content,
      versionNumber: latestVersion + 1,
      createdById: req.user?.id
    });
    
    res.json({
      ...updatedArticle,
      restoredFromVersion: version.versionNumber
    });
  } catch (error) {
    console.error('Error restoring article version:', error);
    res.status(500).json({ message: 'Failed to restore article version' });
  }
});

export default router;
