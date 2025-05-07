import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, User, Calendar } from "lucide-react";
import { Article, Reference } from "@shared/schema";

export default function ArticleDetailsPage() {
  const [_, params] = useRoute<{ slug: string }>("/articles/:slug");
  const slug = params?.slug;

  const { data: article, isLoading: isArticleLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${slug}`],
    enabled: !!slug,
  });

  const { data: references, isLoading: isReferencesLoading } = useQuery<Reference[]>({
    queryKey: [`/api/articles/${article?.id}/references`],
    enabled: !!article?.id,
  });

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isArticleLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8 animate-pulse"></div>
          
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <p className="mb-4">The article you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Record article view
  useEffect(() => {
    if (article?.id) {
      // Send a request to record view
      fetch('/api/analytics/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: article.id,
          referrer: document.referrer || 'direct',
          userAgent: navigator.userAgent,
        }),
      }).catch(err => console.error('Error recording view:', err));
    }
  }, [article?.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link href={`/topics/${article.topicSlug}`}>
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to {article.topicName}
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          {article.title}
        </h1>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(article.createdAt)}
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {article.authorName}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {article.readTime} min read
          </div>
        </div>
        
        <div className="mb-8">
          <p className="text-lg font-medium text-gray-700 mb-4">{article.excerpt}</p>
          
          <div className="prose prose-green max-w-none">
            {article.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
        
        {references && references.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>References</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {references.map((ref) => (
                  <li key={ref.id}>
                    {ref.title}
                    {ref.url && (
                      <a 
                        href={ref.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-green-600 hover:text-green-800 underline"
                      >
                        [Link]
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}