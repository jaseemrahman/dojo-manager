import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Calendar, Award } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingFees: number;
  todayAttendance: number;
  upcomingTests: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    pendingFees: 0,
    todayAttendance: 0,
    upcomingTests: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    // Real-time clock
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboardStats = async () => {
    try {
      // Get all students
      const studentsRes = await api.get("/students/");
      // Handle paginated response which returns an object with results and count
      const studentsData = studentsRes.data;

      // If paginated, use count. If array (fallback), use length.
      const totalStudents = studentsData.count !== undefined ? studentsData.count : studentsData.length;
      // Since backend filters is_active=True, all returned are active.
      const activeStudents = totalStudents;

      // Get fees (filter for pending in backend or frontend)
      const feesRes = await api.get("/fees/?page_size=1000");
      const feesData = feesRes.data.results || feesRes.data;
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const pendingFees = feesData.filter((f: any) =>
        f.month === currentMonth &&
        f.year === currentYear &&
        f.status === "unpaid"
      ).length;

      // Get today's attendance
      const today = new Date().toISOString().split("T")[0];
      const attendanceRes = await api.get("/attendance/?page_size=1000");
      const attendanceData = attendanceRes.data.results || attendanceRes.data;
      const todayAttendance = attendanceData.filter((a: any) =>
        a.date === today && (a.status === "present" || a.status === "late")
      ).length;

      // Get upcoming belt tests
      const testsRes = await api.get("/belt-tests/?page_size=1000");
      const testsData = testsRes.data.results || testsRes.data;
      const upcomingTests = testsData.filter((t: any) =>
        new Date(t.test_date) >= new Date() && t.result === "pending"
      ).length;

      setStats({
        totalStudents,
        activeStudents,
        pendingFees,
        todayAttendance,
        upcomingTests,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add links to cards
  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      subtitle: `${stats.activeStudents} active`,
      icon: Users,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-700",
      link: "/students"
    },
    {
      title: "Pending Fees",
      value: stats.pendingFees,
      subtitle: "This month",
      icon: DollarSign,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-orange-500 to-red-600",
      link: "/fees?status=unpaid"
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      subtitle: "Students present",
      icon: Calendar,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-green-500 to-emerald-700",
      link: "/attendance"
    },
    {
      title: "Upcoming Tests",
      value: stats.upcomingTests,
      subtitle: "Next 30 days",
      icon: Award,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-purple-500 to-indigo-700",
      link: "/belt-tests"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome to your Taekwondo Institute management system
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-2xl font-bold text-primary">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`${card.bgColor} text-white shadow-card hover:shadow-elevated transition-transform transform hover:-translate-y-1 cursor-pointer`}
              onClick={() => navigate(card.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/80">
                  {card.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{card.value}</div>
                <p className="text-xs text-white/70 mt-1">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/students"
              className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/10 transition-colors text-center"
            >
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Manage Students</h3>
              <p className="text-sm text-muted-foreground">Add or edit student records</p>
            </Link>
            <Link
              to="/fees"
              className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/10 transition-colors text-center"
            >
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Track Fees</h3>
              <p className="text-sm text-muted-foreground">Manage monthly payments</p>
            </Link>
            <Link
              to="/attendance"
              className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/10 transition-colors text-center"
            >
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Mark Attendance</h3>
              <p className="text-sm text-muted-foreground">Track daily attendance</p>
            </Link>
            <Link
              to="/belt-tests"
              className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/10 transition-colors text-center"
            >
              <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Belt Tests</h3>
              <p className="text-sm text-muted-foreground">Schedule and record tests</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
