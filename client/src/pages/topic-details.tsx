import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Article, Topic } from "@shared/schema";
import { ChevronLeft } from "lucide-react";

export default function TopicDetailsPage() {
  const [_, params] = useRoute<{ slug: string }>("/topics/:slug");
  const slug = params?.slug;

  const { data: topic, isLoading: isTopicLoading } = useQuery<Topic>({
    queryKey: [`/api/topics/${slug}`],
    enabled: !!slug,
  });

  const { data: articlesData, isLoading: isArticlesLoading } = useQuery<{ articles: Article[], total: number }>({
    queryKey: ["/api/articles", { topicId: topic?.id }],
    enabled: !!topic?.id,
  });

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isTopicLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-6 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-full mb-8 animate-pulse"></div>
          
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4 animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Topic not found</h1>
          <p className="mb-4">The topic you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Topics
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          {topic.name}
        </h1>
        <p className="text-gray-600 mb-8">{topic.description}</p>
        
        <h2 className="text-2xl font-semibold mb-4">Articles</h2>
        
        {isArticlesLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="mb-4 animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))
        ) : articlesData?.articles.length === 0 ? (
          <p className="text-gray-500">No articles available for this topic yet.</p>
        ) : (
          articlesData?.articles.map(article => (
            <Card key={article.id} className="mb-4 hover:shadow-md transition-shadow">
              <CardHeader>
                <Link href={`/articles/${article.slug}`}>
                  <CardTitle className="text-lg cursor-pointer hover:text-primary">
                    {article.title}
                  </CardTitle>
                </Link>
                <div className="text-sm text-gray-500">
                  {formatDate(article.createdAt)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 line-clamp-2">{article.excerpt}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}