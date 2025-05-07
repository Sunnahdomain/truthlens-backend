import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../auth';
import { insertTopicSchema } from '@shared/schema';
import { ZodError } from 'zod';
import slugify from 'slugify';

const router = Router();

// Get all topics
router.get('/', async (_req: Request, res: Response) => {
  try {
    const topics = await storage.getTopics();
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Failed to fetch topics' });
  }
});

// Create a new topic (admin only)
router.post('/', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const topicData = insertTopicSchema.parse(req.body);
    
    // Generate slug if not provided
    if (!topicData.slug) {
      topicData.slug = slugify(topicData.name, { 
        lower: true,
        strict: true
      });
    }
    
    const newTopic = await storage.createTopic(topicData);
    res.status(201).json(newTopic);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid topic data', errors: error.errors });
    }
    
    console.error('Error creating topic:', error);
    
    // Check for duplicate key violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({ message: 'Topic with this name or slug already exists' });
    }
    
    res.status(500).json({ message: 'Failed to create topic' });
  }
});

// Get a single topic
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const topic = await storage.getTopic(id);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ message: 'Failed to fetch topic' });
  }
});

// Update a topic (admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const topic = await storage.getTopic(id);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Parse and validate the update data
    const updateData = insertTopicSchema.partial().parse(req.body);
    
    // Update slug if name changed and slug not provided
    if (updateData.name && !updateData.slug) {
      updateData.slug = slugify(updateData.name, { 
        lower: true,
        strict: true
      });
    }
    
    const updatedTopic = await storage.updateTopic(id, updateData);
    res.json(updatedTopic);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid topic data', errors: error.errors });
    }
    
    console.error('Error updating topic:', error);
    
    // Check for duplicate key violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({ message: 'Topic with this name or slug already exists' });
    }
    
    res.status(500).json({ message: 'Failed to update topic' });
  }
});

// Delete a topic (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const topic = await storage.getTopic(id);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    await storage.deleteTopic(id);
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Failed to delete topic' });
  }
});

export default router;
