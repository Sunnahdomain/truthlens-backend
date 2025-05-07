import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Topic } from "@shared/schema";
import { Link } from "wouter";

export default function HomePage() {
  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
    staleTime: 60000,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
        TruthLens Islamic Content Platform
      </h1>
      
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to TruthLens</CardTitle>
            <CardDescription>
              Discover authentic Islamic content across various topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              TruthLens provides a comprehensive platform for exploring Islamic knowledge,
              from fundamental beliefs to contemporary issues. Browse our collection of articles,
              organized by topics.
            </p>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-semibold mb-4">Topics</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics?.map((topic) => (
              <Link key={topic.id} href={`/topics/${topic.slug}`}>
                <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{topic.name}</CardTitle>
                    <CardDescription>
                      {topic.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}