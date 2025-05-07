import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { MenuIcon, UserCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user");
        return await res.json();
      } catch (error) {
        // If 401, return null instead of throwing
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Invalidate the user query
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent cursor-pointer">
              TruthLens
            </div>
          </Link>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <MenuIcon className="h-6 w-6 text-gray-600" />
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <div className="text-gray-600 hover:text-green-600 transition-colors cursor-pointer">Home</div>
            </Link>
            {user && user.role === 'admin' && (
              <Link href="/admin">
                <div className="text-gray-600 hover:text-green-600 transition-colors cursor-pointer">Admin</div>
              </Link>
            )}
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-sm font-medium text-gray-700">
                      <UserCircle className="h-5 w-5 mr-1 text-green-600" />
                      {user.username}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Link href="/auth">
                    <Button variant="default" size="sm">
                      Login / Register
                    </Button>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 py-2 px-2 bg-gray-50 rounded-md">
            <div className="flex flex-col space-y-3">
              <Link href="/">
                <div className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 cursor-pointer">Home</div>
              </Link>
              {user && user.role === 'admin' && (
                <Link href="/admin">
                  <div className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 cursor-pointer">Admin</div>
                </Link>
              )}
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <div className="px-3 py-2 flex items-center text-sm font-medium text-gray-700">
                        <UserCircle className="h-5 w-5 mr-1 text-green-600" />
                        {user.username}
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link href="/auth">
                      <div className="px-3 py-2 bg-green-600 rounded-md text-white font-medium text-center cursor-pointer">
                        Login / Register
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}