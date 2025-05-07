import { pgTable, text, serial, integer, boolean, timestamp, date, index, primaryKey, foreignKey, json, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { type InferSelectModel } from "drizzle-orm";

// User role enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  role: userRoleEnum("role").default('user').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Topics table for categorizing articles
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Articles table for main content
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  content: text("content").notNull(),
  topicId: integer("topic_id").references(() => topics.id, { onDelete: 'set null' }),
  authorId: integer("author_id").references(() => users.id, { onDelete: 'set null' }),
  status: text("status").notNull().default('draft'), // draft, published, archived
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    topicIdIdx: index("article_topic_id_idx").on(table.topicId),
    authorIdIdx: index("article_author_id_idx").on(table.authorId),
    slugIdx: index("article_slug_idx").on(table.slug),
  };
});

// References table for article citations
export const references = pgTable("references", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  url: text("url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    articleIdIdx: index("reference_article_id_idx").on(table.articleId),
  };
});

// ArticleVersions table for version history
export const articleVersions = pgTable("article_versions", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  versionNumber: integer("version_number").notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    articleIdIdx: index("article_version_article_id_idx").on(table.articleId),
  };
});

// ArticleViews table for analytics
export const articleViews = pgTable("article_views", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  ip: text("ip"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => {
  return {
    articleIdIdx: index("article_view_article_id_idx").on(table.articleId),
    viewedAtIdx: index("article_view_viewed_at_idx").on(table.viewedAt),
  };
});

// ArticleBounces table for analytics
export const articleBounces = pgTable("article_bounces", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  ip: text("ip"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  timeOnPage: integer("time_on_page"), // seconds
  bouncedAt: timestamp("bounced_at").defaultNow().notNull(),
}, (table) => {
  return {
    articleIdIdx: index("article_bounce_article_id_idx").on(table.articleId),
    bouncedAtIdx: index("article_bounce_bounced_at_idx").on(table.bouncedAt),
  };
});

// SocialShares table for tracking shares
export const socialShares = pgTable("social_shares", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  platform: text("platform").notNull(), // facebook, twitter, whatsapp, etc.
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
}, (table) => {
  return {
    articleIdIdx: index("social_share_article_id_idx").on(table.articleId),
    platformIdx: index("social_share_platform_idx").on(table.platform),
  };
});

// DailyArticleStats table for aggregated analytics
export const dailyArticleStats = pgTable("daily_article_stats", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  date: date("date").notNull(),
  views: integer("views").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  bounces: integer("bounces").notNull().default(0),
  averageTimeOnPage: integer("average_time_on_page").notNull().default(0), // seconds
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    articleDateIdx: index("daily_article_stats_article_date_idx").on(table.articleId, table.date),
    dateIdx: index("daily_article_stats_date_idx").on(table.date),
  };
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  articleVersions: many(articleVersions),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  topic: one(topics, { fields: [articles.topicId], references: [topics.id] }),
  author: one(users, { fields: [articles.authorId], references: [users.id] }),
  references: many(references),
  versions: many(articleVersions),
  views: many(articleViews),
  bounces: many(articleBounces),
  shares: many(socialShares),
  dailyStats: many(dailyArticleStats),
}));

export const referencesRelations = relations(references, ({ one }) => ({
  article: one(articles, { fields: [references.articleId], references: [articles.id] }),
}));

export const articleVersionsRelations = relations(articleVersions, ({ one }) => ({
  article: one(articles, { fields: [articleVersions.articleId], references: [articles.id] }),
  createdBy: one(users, { fields: [articleVersions.createdById], references: [users.id] }),
}));

export const articleViewsRelations = relations(articleViews, ({ one }) => ({
  article: one(articles, { fields: [articleViews.articleId], references: [articles.id] }),
  user: one(users, { fields: [articleViews.userId], references: [users.id] }),
}));

export const articleBouncesRelations = relations(articleBounces, ({ one }) => ({
  article: one(articles, { fields: [articleBounces.articleId], references: [articles.id] }),
  user: one(users, { fields: [articleBounces.userId], references: [users.id] }),
}));

export const socialSharesRelations = relations(socialShares, ({ one }) => ({
  article: one(articles, { fields: [socialShares.articleId], references: [articles.id] }),
  user: one(users, { fields: [socialShares.userId], references: [users.id] }),
}));

export const dailyArticleStatsRelations = relations(dailyArticleStats, ({ one }) => ({
  article: one(articles, { fields: [dailyArticleStats.articleId], references: [articles.id] }),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferenceSchema = createInsertSchema(references).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleVersionSchema = createInsertSchema(articleVersions).omit({
  id: true,
  createdAt: true,
});

export const insertArticleViewSchema = createInsertSchema(articleViews).omit({
  id: true,
  viewedAt: true,
});

export const insertArticleBounceSchema = createInsertSchema(articleBounces).omit({
  id: true,
  bouncedAt: true,
});

export const insertSocialShareSchema = createInsertSchema(socialShares).omit({
  id: true,
  sharedAt: true,
});

export const insertDailyArticleStatSchema = createInsertSchema(dailyArticleStats).omit({
  id: true,
  updatedAt: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertReference = z.infer<typeof insertReferenceSchema>;
export type InsertArticleVersion = z.infer<typeof insertArticleVersionSchema>;
export type InsertArticleView = z.infer<typeof insertArticleViewSchema>;
export type InsertArticleBounce = z.infer<typeof insertArticleBounceSchema>;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
export type InsertDailyArticleStat = z.infer<typeof insertDailyArticleStatSchema>;

export type User = InferSelectModel<typeof users>;
export type Topic = InferSelectModel<typeof topics>;
export type Article = InferSelectModel<typeof articles>;
export type Reference = InferSelectModel<typeof references>;
export type ArticleVersion = InferSelectModel<typeof articleVersions>;
export type ArticleView = InferSelectModel<typeof articleViews>;
export type ArticleBounce = InferSelectModel<typeof articleBounces>;
export type SocialShare = InferSelectModel<typeof socialShares>;
export type DailyArticleStat = InferSelectModel<typeof dailyArticleStats>;
