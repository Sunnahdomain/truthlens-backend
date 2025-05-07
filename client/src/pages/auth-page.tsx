import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type AuthFormData = {
  username: string;
  password: string;
  name?: string;
};

export default function AuthPage() {
  const [formData, setFormData] = useState<AuthFormData>({
    username: "",
    password: "",
    name: "",
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: formData.username,
      password: formData.password,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                TruthLens
              </h1>
              <p className="text-gray-600">
                Your trusted source for authentic Islamic content
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-username">Username</Label>
                          <Input
                            id="login-username"
                            name="username"
                            placeholder="Enter your username"
                            required
                            value={formData.username}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <Input
                            id="login-password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            "Login"
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={handleRegister}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-name">Full Name</Label>
                          <Input
                            id="register-name"
                            name="name"
                            placeholder="Enter your name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-username">Username</Label>
                          <Input
                            id="register-username"
                            name="username"
                            placeholder="Choose a username"
                            required
                            value={formData.username}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <Input
                            id="register-password"
                            name="password"
                            type="password"
                            placeholder="Choose a strong password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            "Register"
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="hidden md:flex flex-col justify-center">
            <div className="bg-green-50 p-8 rounded-lg border border-green-100">
              <h2 className="text-2xl font-bold mb-4 text-green-700">
                Discover Islamic Knowledge
              </h2>
              <p className="mb-4 text-gray-700">
                TruthLens provides a comprehensive platform for exploring authentic
                Islamic content across various topics:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-2 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>Access verified Islamic articles and resources</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-2 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>Explore topics from Islamic beliefs to contemporary issues</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-2 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>Learn from well-researched articles with proper references</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}