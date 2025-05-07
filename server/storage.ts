import { 
  users, topics, articles, references, articleVersions, 
  articleViews, articleBounces, socialShares, dailyArticleStats,
  type User, type InsertUser, type Topic, type InsertTopic,
  type Article, type InsertArticle, type Reference, type InsertReference,
  type ArticleVersion, type InsertArticleVersion, type ArticleView, type InsertArticleView,
  type ArticleBounce, type InsertArticleBounce, type SocialShare, type InsertSocialShare,
  type DailyArticleStat, type InsertDailyArticleStat
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, count, SQL, like } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Topic operations
  getTopic(id: number): Promise<Topic | undefined>;
  getTopicBySlug(slug: string): Promise<Topic | undefined>;
  getTopics(): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: number, topic: Partial<InsertTopic>): Promise<Topic | undefined>;
  deleteTopic(id: number): Promise<boolean>;
  
  // Article operations
  getArticle(id: number): Promise<Article | undefined>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getArticles(options?: {
    topicId?: number;
    status?: string;
    authorId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ articles: Article[]; total: number }>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  
  // Reference operations
  getReferences(articleId: number): Promise<Reference[]>;
  createReference(reference: InsertReference): Promise<Reference>;
  updateReference(id: number, reference: Partial<InsertReference>): Promise<Reference | undefined>;
  deleteReference(id: number): Promise<boolean>;
  
  // Version operations
  getArticleVersions(articleId: number): Promise<ArticleVersion[]>;
  getArticleVersion(id: number): Promise<ArticleVersion | undefined>;
  createArticleVersion(version: InsertArticleVersion): Promise<ArticleVersion>;
  
  // Analytics operations
  recordArticleView(view: InsertArticleView): Promise<ArticleView>;
  recordArticleBounce(bounce: InsertArticleBounce): Promise<ArticleBounce>;
  recordSocialShare(share: InsertSocialShare): Promise<SocialShare>;
  getArticleStats(articleId: number, startDate?: Date, endDate?: Date): Promise<DailyArticleStat[]>;
  getOverviewStats(startDate?: Date, endDate?: Date): Promise<{
    totalViews: number;
    totalShares: number;
    totalArticles: number;
    topArticles: { id: number; title: string; views: number }[];
  }>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      tableName: 'sessions',
      createTableIfMissing: true 
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  // Topic operations
  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }
  
  async getTopicBySlug(slug: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.slug, slug));
    return topic;
  }
  
  async getTopics(): Promise<Topic[]> {
    return await db.select().from(topics).orderBy(topics.name);
  }
  
  async createTopic(topicData: InsertTopic): Promise<Topic> {
    const [topic] = await db.insert(topics).values(topicData).returning();
    return topic;
  }
  
  async updateTopic(id: number, topicData: Partial<InsertTopic>): Promise<Topic | undefined> {
    const [updated] = await db
      .update(topics)
      .set({ ...topicData, updatedAt: new Date() })
      .where(eq(topics.id, id))
      .returning();
    return updated;
  }
  
  async deleteTopic(id: number): Promise<boolean> {
    const result = await db.delete(topics).where(eq(topics.id, id));
    return true;
  }
  
  // Article operations
  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }
  
  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.slug, slug));
    return article;
  }
  
  async getArticles(options: {
    topicId?: number;
    status?: string;
    authorId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ articles: Article[]; total: number }> {
    const { topicId, status, authorId, search, limit = 10, offset = 0 } = options;
    
    let conditions: SQL<unknown>[] = [];
    
    if (topicId) {
      conditions.push(eq(articles.topicId, topicId));
    }
    
    if (status) {
      conditions.push(eq(articles.status, status));
    }
    
    if (authorId) {
      conditions.push(eq(articles.authorId, authorId));
    }
    
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        sql`(${articles.title} ILIKE ${searchPattern} OR ${articles.description} ILIKE ${searchPattern} OR ${articles.content} ILIKE ${searchPattern})`
      );
    }
    
    const whereClause = conditions.length > 0 
      ? conditions.reduce((acc, condition) => and(acc, condition))
      : undefined;
    
    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(articles)
      .where(whereClause);
    
    // Get articles
    const articlesResult = await db
      .select()
      .from(articles)
      .where(whereClause)
      .orderBy(desc(articles.updatedAt))
      .limit(limit)
      .offset(offset);
    
    return {
      articles: articlesResult,
      total: totalResult?.count as number || 0,
    };
  }
  
  async createArticle(articleData: InsertArticle): Promise<Article> {
    const [article] = await db.insert(articles).values(articleData).returning();
    return article;
  }
  
  async updateArticle(id: number, articleData: Partial<InsertArticle>): Promise<Article | undefined> {
    const [updated] = await db
      .update(articles)
      .set({ ...articleData, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return updated;
  }
  
  async deleteArticle(id: number): Promise<boolean> {
    await db.delete(articles).where(eq(articles.id, id));
    return true;
  }
  
  // Reference operations
  async getReferences(articleId: number): Promise<Reference[]> {
    return db
      .select()
      .from(references)
      .where(eq(references.articleId, articleId))
      .orderBy(references.createdAt);
  }
  
  async createReference(referenceData: InsertReference): Promise<Reference> {
    const [reference] = await db.insert(references).values(referenceData).returning();
    return reference;
  }
  
  async updateReference(id: number, referenceData: Partial<InsertReference>): Promise<Reference | undefined> {
    const [updated] = await db
      .update(references)
      .set({ ...referenceData, updatedAt: new Date() })
      .where(eq(references.id, id))
      .returning();
    return updated;
  }
  
  async deleteReference(id: number): Promise<boolean> {
    await db.delete(references).where(eq(references.id, id));
    return true;
  }
  
  // Version operations
  async getArticleVersions(articleId: number): Promise<ArticleVersion[]> {
    return db
      .select()
      .from(articleVersions)
      .where(eq(articleVersions.articleId, articleId))
      .orderBy(desc(articleVersions.versionNumber));
  }
  
  async getArticleVersion(id: number): Promise<ArticleVersion | undefined> {
    const [version] = await db
      .select()
      .from(articleVersions)
      .where(eq(articleVersions.id, id));
    return version;
  }
  
  async createArticleVersion(versionData: InsertArticleVersion): Promise<ArticleVersion> {
    const [version] = await db.insert(articleVersions).values(versionData).returning();
    return version;
  }
  
  // Analytics operations
  async recordArticleView(viewData: InsertArticleView): Promise<ArticleView> {
    const [view] = await db.insert(articleViews).values(viewData).returning();
    
    // Update or create daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existingStat] = await db
      .select()
      .from(dailyArticleStats)
      .where(
        and(
          eq(dailyArticleStats.articleId, viewData.articleId),
          eq(dailyArticleStats.date, today)
        )
      );
    
    if (existingStat) {
      await db
        .update(dailyArticleStats)
        .set({ 
          views: existingStat.views + 1,
          updatedAt: new Date()
        })
        .where(eq(dailyArticleStats.id, existingStat.id));
    } else {
      await db
        .insert(dailyArticleStats)
        .values({
          articleId: viewData.articleId,
          date: today,
          views: 1,
          shares: 0,
          bounces: 0,
          averageTimeOnPage: 0
        });
    }
    
    return view;
  }
  
  async recordArticleBounce(bounceData: InsertArticleBounce): Promise<ArticleBounce> {
    const [bounce] = await db.insert(articleBounces).values(bounceData).returning();
    
    // Update daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existingStat] = await db
      .select()
      .from(dailyArticleStats)
      .where(
        and(
          eq(dailyArticleStats.articleId, bounceData.articleId),
          eq(dailyArticleStats.date, today)
        )
      );
    
    if (existingStat) {
      const newBounces = existingStat.bounces + 1;
      let newAvgTime = existingStat.averageTimeOnPage;
      
      if (bounceData.timeOnPage) {
        const totalTime = existingStat.averageTimeOnPage * existingStat.bounces + bounceData.timeOnPage;
        newAvgTime = Math.round(totalTime / newBounces);
      }
      
      await db
        .update(dailyArticleStats)
        .set({ 
          bounces: newBounces,
          averageTimeOnPage: newAvgTime,
          updatedAt: new Date()
        })
        .where(eq(dailyArticleStats.id, existingStat.id));
    } else {
      await db
        .insert(dailyArticleStats)
        .values({
          articleId: bounceData.articleId,
          date: today,
          views: 0,
          shares: 0,
          bounces: 1,
          averageTimeOnPage: bounceData.timeOnPage || 0
        });
    }
    
    return bounce;
  }
  
  async recordSocialShare(shareData: InsertSocialShare): Promise<SocialShare> {
    const [share] = await db.insert(socialShares).values(shareData).returning();
    
    // Update daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existingStat] = await db
      .select()
      .from(dailyArticleStats)
      .where(
        and(
          eq(dailyArticleStats.articleId, shareData.articleId),
          eq(dailyArticleStats.date, today)
        )
      );
    
    if (existingStat) {
      await db
        .update(dailyArticleStats)
        .set({ 
          shares: existingStat.shares + 1,
          updatedAt: new Date()
        })
        .where(eq(dailyArticleStats.id, existingStat.id));
    } else {
      await db
        .insert(dailyArticleStats)
        .values({
          articleId: shareData.articleId,
          date: today,
          views: 0,
          shares: 1,
          bounces: 0,
          averageTimeOnPage: 0
        });
    }
    
    return share;
  }
  
  async getArticleStats(
    articleId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<DailyArticleStat[]> {
    let query = db
      .select()
      .from(dailyArticleStats)
      .where(eq(dailyArticleStats.articleId, articleId));
    
    if (startDate) {
      query = query.where(gte(dailyArticleStats.date, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(dailyArticleStats.date, endDate));
    }
    
    return query.orderBy(dailyArticleStats.date);
  }
  
  async getOverviewStats(startDate?: Date, endDate?: Date) {
    // Get total views
    let viewsQuery = db
      .select({ 
        count: sql`COUNT(*)` 
      })
      .from(articleViews);
    
    if (startDate) {
      viewsQuery = viewsQuery.where(gte(articleViews.viewedAt, startDate));
    }
    
    if (endDate) {
      viewsQuery = viewsQuery.where(lte(articleViews.viewedAt, endDate));
    }
    
    const [viewsResult] = await viewsQuery;
    
    // Get total shares
    let sharesQuery = db
      .select({ 
        count: sql`COUNT(*)` 
      })
      .from(socialShares);
    
    if (startDate) {
      sharesQuery = sharesQuery.where(gte(socialShares.sharedAt, startDate));
    }
    
    if (endDate) {
      sharesQuery = sharesQuery.where(lte(socialShares.sharedAt, endDate));
    }
    
    const [sharesResult] = await sharesQuery;
    
    // Get total articles
    const [articlesResult] = await db
      .select({ 
        count: sql`COUNT(*)` 
      })
      .from(articles)
      .where(eq(articles.status, 'published'));
    
    // Get top articles by views
    const articleAlias = alias(articles, 'a');
    const topArticlesResult = await db
      .select({
        id: articleAlias.id,
        title: articleAlias.title,
        views: sql<number>`COUNT(${articleViews.id})`.as('views')
      })
      .from(articleViews)
      .innerJoin(articleAlias, eq(articleViews.articleId, articleAlias.id))
      .groupBy(articleAlias.id, articleAlias.title)
      .orderBy(desc(sql`views`))
      .limit(5);
    
    return {
      totalViews: Number(viewsResult?.count || 0),
      totalShares: Number(sharesResult?.count || 0),
      totalArticles: Number(articlesResult?.count || 0),
      topArticles: topArticlesResult,
    };
  }
}

export const storage = new DatabaseStorage();
