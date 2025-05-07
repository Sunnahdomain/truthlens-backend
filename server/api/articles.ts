import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../auth';
import { 
  insertArticleSchema, 
  insertReferenceSchema
} from '@shared/schema';
import { ZodError } from 'zod';
import slugify from 'slugify';

const router = Router();

// Get all articles with filtering and search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      topic_id, 
      status, 
      author_id, 
      search, 
      limit = '10', 
      offset = '0' 
    } = req.query as Record<string, string>;
    
    const options = {
      topicId: topic_id ? parseInt(topic_id) : undefined,
      status: status,
      authorId: author_id ? parseInt(author_id) : undefined,
      search: search,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    const result = await storage.getArticles(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Failed to fetch articles' });
  }
});

// Get a single article by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await storage.getArticle(id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Get references for this article
    const references = await storage.getReferences(id);
    
    res.json({ ...article, references });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ message: 'Failed to fetch article' });
  }
});

// Create a new article (admin only)
router.post('/', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const articleData = insertArticleSchema.parse(req.body);
    
    // Generate slug if not provided
    if (!articleData.slug) {
      articleData.slug = slugify(articleData.title, { 
        lower: true,
        strict: true
      });
    }
    
    // Set author to current user if not specified
    if (!articleData.authorId && req.user) {
      articleData.authorId = req.user.id;
    }
    
    // Set published date if status is 'published'
    if (articleData.status === 'published' && !articleData.publishedAt) {
      articleData.publishedAt = new Date();
    }
    
    const newArticle = await storage.createArticle(articleData);
    
    // Handle references if provided
    const references = req.body.references || [];
    const savedReferences = [];
    
    for (const reference of references) {
      const referenceData = insertReferenceSchema.parse({
        ...reference,
        articleId: newArticle.id
      });
      
      const savedReference = await storage.createReference(referenceData);
      savedReferences.push(savedReference);
    }
    
    // Create initial version
    await storage.createArticleVersion({
      articleId: newArticle.id,
      title: newArticle.title,
      description: newArticle.description,
      content: newArticle.content,
      versionNumber: 1,
      createdById: req.user?.id
    });
    
    res.status(201).json({ ...newArticle, references: savedReferences });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid article data', errors: error.errors });
    }
    console.error('Error creating article:', error);
    res.status(500).json({ message: 'Failed to create article' });
  }
});

// Update an existing article (admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await storage.getArticle(id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Parse and validate the update data
    const updateData = insertArticleSchema.partial().parse(req.body);
    
    // Update slug if title changed and slug not provided
    if (updateData.title && !updateData.slug) {
      updateData.slug = slugify(updateData.title, { 
        lower: true,
        strict: true
      });
    }
    
    // Set published date if status changed to 'published'
    if (updateData.status === 'published' && article.status !== 'published') {
      updateData.publishedAt = new Date();
    }
    
    const updatedArticle = await storage.updateArticle(id, updateData);
    
    // Get current version number
    const versions = await storage.getArticleVersions(id);
    const latestVersion = versions[0]?.versionNumber || 0;
    
    // Create new version if content changed
    if (updateData.content || updateData.title) {
      await storage.createArticleVersion({
        articleId: id,
        title: updateData.title || article.title,
        description: updateData.description || article.description,
        content: updateData.content || article.content,
        versionNumber: latestVersion + 1,
        createdById: req.user?.id
      });
    }
    
    // Handle references if provided
    if (req.body.references) {
      // Delete existing references
      const existingRefs = await storage.getReferences(id);
      for (const ref of existingRefs) {
        await storage.deleteReference(ref.id);
      }
      
      // Add new references
      const savedReferences = [];
      for (const reference of req.body.references) {
        const referenceData = insertReferenceSchema.parse({
          ...reference,
          articleId: id
        });
        
        const savedReference = await storage.createReference(referenceData);
        savedReferences.push(savedReference);
      }
      
      // Get updated references
      const references = await storage.getReferences(id);
      res.json({ ...updatedArticle, references });
    } else {
      // Get references for this article
      const references = await storage.getReferences(id);
      res.json({ ...updatedArticle, references });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid article data', errors: error.errors });
    }
    console.error('Error updating article:', error);
    res.status(500).json({ message: 'Failed to update article' });
  }
});

// Delete an article (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const article = await storage.getArticle(id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    await storage.deleteArticle(id);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ message: 'Failed to delete article' });
  }
});

export default router;
