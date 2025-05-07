import { db } from '../db';
import { storage } from '../storage';
import { hashPassword } from '../auth';
import { InsertUser, InsertTopic, InsertArticle, InsertReference } from '@shared/schema';
import slugify from 'slugify';

// Initial topics
const topicsData: InsertTopic[] = [
  {
    name: 'Islamic Beliefs',
    description: 'Fundamental beliefs and concepts in Islam',
    slug: 'islamic-beliefs'
  },
  {
    name: 'Prophetic Traditions',
    description: 'Teachings and traditions of Prophet Muhammad (PBUH)',
    slug: 'prophetic-traditions'
  },
  {
    name: 'Islamic History',
    description: 'Historical events and figures in Islamic history',
    slug: 'islamic-history'
  },
  {
    name: 'Contemporary Issues',
    description: 'Modern challenges and issues facing Muslims today',
    slug: 'contemporary-issues'
  },
  {
    name: 'Spirituality',
    description: 'Spiritual growth and development in Islam',
    slug: 'spirituality'
  }
];

// Sample articles for seeding
const articlesData = [
  {
    title: 'The Importance of Salah in Daily Life',
    description: 'Understanding the significance of prayer in a Muslim\'s life',
    content: `
# The Importance of Salah in Daily Life

Prayer (Salah) is one of the Five Pillars of Islam and is the most important form of worship in a Muslim's life. It is a direct connection between the worshipper and Allah.

## Spiritual Benefits

Regular prayer helps Muslims maintain awareness of Allah throughout their day. It serves as a reminder of our purpose and keeps us spiritually grounded.

## Practical Benefits

In addition to spiritual benefits, prayer provides practical advantages:
- Creates discipline and routine
- Provides regular breaks from daily stresses
- Encourages physical movement
- Builds community when performed in congregation

## How to Establish a Strong Prayer Habit

1. Start by praying the obligatory prayers on time
2. Gradually add voluntary prayers
3. Focus on quality over quantity
4. Learn the meanings of what you recite
5. Remember that consistency is key

Allah says in the Quran:

> "Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater." (29:45)

Make prayer a priority in your life, and you will see positive changes in your spiritual and worldly affairs.
    `,
    topicId: 1,
    status: 'published',
    slug: 'importance-of-salah-daily-life',
    references: [
      {
        title: 'Quran 29:45',
        description: 'Verse mentioning the importance of prayer'
      },
      {
        title: 'Sahih Bukhari',
        description: 'Collection of authentic hadith'
      }
    ]
  },
  {
    title: 'Understanding the Quran in Modern Context',
    description: 'Approaches to interpreting the Quran for contemporary Muslims',
    content: `
# Understanding the Quran in Modern Context

The Quran, as the literal word of Allah, contains guidance for all times and places. However, understanding and applying its teachings in different eras requires thoughtful interpretation.

## Principles of Quranic Interpretation

Islamic scholars have developed various principles to ensure proper understanding of the Quran:

1. **Understanding the Arabic language**: The Quran was revealed in Arabic, and understanding its linguistic features is crucial.

2. **Context of revelation**: Many verses were revealed in response to specific situations. Understanding these contexts helps clarify meaning.

3. **Holistic approach**: The Quran should be understood as a unified message, avoiding cherry-picking of verses.

4. **Authentic traditions**: The Prophet's explanations and applications provide essential context.

## Contemporary Approaches

Modern scholars employ various methods to make the Quran relevant to contemporary issues:

- **Thematic interpretation**: Gathering verses on specific themes to derive comprehensive understanding
- **Objectives-based interpretation**: Focusing on the higher objectives of Islamic law
- **Contextual reading**: Distinguishing between universal principles and contextual applications

## Challenges and Solutions

Muslims today face unique challenges that require thoughtful engagement with scripture:

- Scientific advancements
- Technological ethics
- Global citizenship
- Gender relations
- Interfaith coexistence

The Quran provides timeless principles that can be applied to these emerging issues when approached with proper methodology and sincerity.
    `,
    topicId: 1,
    status: 'published',
    slug: 'understanding-quran-modern-context',
    references: [
      {
        title: 'Usul al-Tafsir',
        description: 'Principles of Quranic exegesis'
      },
      {
        title: 'Contemporary Approaches to the Quran',
        url: 'https://www.example.com/quran-interpretation',
        description: 'Academic article on modern Quranic interpretation'
      }
    ]
  },
  {
    title: 'The Life of Prophet Muhammad',
    description: 'Biography of the final messenger of Islam',
    content: `
# The Life of Prophet Muhammad ﷺ

Prophet Muhammad ﷺ (peace be upon him) was born in Makkah around 570 CE. He received his first revelation at the age of 40 and dedicated the remaining 23 years of his life to spreading the message of Islam.

## Early Life

Born an orphan, young Muhammad was raised first by his grandfather Abd al-Muttalib and then by his uncle Abu Talib. Even before prophethood, he was known among the Makkans as "Al-Amin" (The Trustworthy) for his exceptional honesty and character.

## Revelation and Early Mission

At age 40, while meditating in the Cave of Hira, Muhammad received his first revelation through Angel Jibreel (Gabriel). The initial years of his prophethood were marked by hardship and persecution as he invited people to monotheism in the polytheistic society.

## Migration and Establishment of the Islamic State

After 13 years of preaching in Makkah, the Prophet and his followers migrated to Madinah (the Hijrah), marking the beginning of the Islamic calendar. In Madinah, he established the first Islamic society, created a brotherhood between the migrants and locals, and formulated treaties with various tribes.

## Character and Teachings

Prophet Muhammad exemplified the teachings of the Quran through his character and actions. He emphasized:

- Mercy and compassion
- Justice and equality
- Honesty and integrity
- Moderation in all affairs
- Respect for all creation

## Legacy

The Prophet's legacy continues to inspire billions around the world. His detailed biography (Seerah) serves as a practical model for implementing Islamic teachings in daily life.

Anas ibn Malik reported that the Prophet said:

> "None of you truly believes until I am more beloved to him than his child, parent, and all of mankind." (Bukhari and Muslim)
    `,
    topicId: 2,
    status: 'published',
    slug: 'life-of-prophet-muhammad',
    references: [
      {
        title: 'The Sealed Nectar',
        description: 'Biography of the Prophet by Safiur-Rahman Mubarakpuri'
      },
      {
        title: 'Sahih Bukhari and Muslim',
        description: 'Authentic hadith collections containing narrations about the Prophet\'s life'
      }
    ]
  }
];

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Check if admin user exists
    const adminExists = await storage.getUserByUsername('admin');
    
    if (!adminExists) {
      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      const adminUser: InsertUser = {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@truthlens.com',
        fullName: 'Admin User',
        role: 'admin'
      };
      
      console.log('Creating admin user...');
      const admin = await storage.createUser(adminUser);
      console.log('Admin user created with ID:', admin.id);

      // Create topics
      for (const topic of topicsData) {
        console.log(`Creating topic: ${topic.name}...`);
        await storage.createTopic(topic);
      }

      // Create articles
      const topics = await storage.getTopics();
      const topicMap = topics.reduce((map, topic) => {
        map[topic.name] = topic.id;
        return map;
      }, {} as Record<string, number>);

      for (const article of articlesData) {
        console.log(`Creating article: ${article.title}...`);
        const references = article.references || [];
        delete (article as any).references;
        
        // Set the proper topicId using the map
        if (typeof article.topicId === 'number') {
          const topicName = topics.find(t => t.id === article.topicId)?.name;
          if (topicName && topicMap[topicName]) {
            article.topicId = topicMap[topicName];
          }
        }
        
        // Add author ID and dates
        const articleData: InsertArticle = {
          ...article,
          authorId: admin.id,
          publishedAt: article.status === 'published' ? new Date() : undefined
        };
        
        // Create article
        const newArticle = await storage.createArticle(articleData);
        
        // Add references
        for (const ref of references) {
          await storage.createReference({
            ...ref,
            articleId: newArticle.id
          });
        }
        
        // Create initial version
        await storage.createArticleVersion({
          articleId: newArticle.id,
          title: newArticle.title,
          description: newArticle.description || '',
          content: newArticle.content,
          versionNumber: 1,
          createdById: admin.id
        });
      }
      
      console.log('Database seeding completed successfully!');
    } else {
      console.log('Admin user already exists, skipping database seeding.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
