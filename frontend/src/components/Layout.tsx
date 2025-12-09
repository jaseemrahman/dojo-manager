import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  Award,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/students", icon: Users, label: "Students" },
    { path: "/fees", icon: DollarSign, label: "Fees" },
    { path: "/attendance", icon: Calendar, label: "Attendance" },
    { path: "/belt-tests", icon: Award, label: "Belt Tests" },
  ];

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col shadow-card transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-primary flex items-center justify-center text-white text-lg sm:text-xl font-bold">
              TKD
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Taekwondo</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Institute</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-3 sm:px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if current path matches or if it's a student profile page and item is Students
            const isActive = location.pathname === item.path ||
              (location.pathname.startsWith('/students/') && item.path === '/students');

            return (
              <div
                key={item.path}
                onClick={() => {
                  setSidebarOpen(false);
                  // Only reload if we are exactly on the same path
                  if (location.pathname === item.path) {
                    navigate(0); // Force reload if already on the page
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors cursor-pointer ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
                  }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-border">
          <div className="mb-3 px-3 sm:px-4">
            <p className="text-xs sm:text-sm font-medium truncate">{user.email}</p>
            {isAdmin && (
              <p className="text-xs text-primary font-semibold">Admin</p>
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 mb-2 text-sm font-medium pl-3"
            onClick={() => {
              setSidebarOpen(false);
              navigate("/profile");
            }}
          >
            <User className="h-4 w-4" />
            My Profile
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-border p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
              TKD
            </div>
            <span className="font-bold">Taekwondo Institute</span>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
