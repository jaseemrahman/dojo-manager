import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import BeltTestDialog from "@/components/belt-tests/BeltTestDialog";
import BeltTestCard from "@/components/belt-tests/BeltTestCard";
import { ExportBeltTestDialog } from "@/components/belt-tests/ExportBeltTestDialog";
import { useAuth } from "@/contexts/AuthContext";

const BeltTests = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, studentsRes] = await Promise.all([
        api.get("/belt-tests/"),
        api.get("/students/?page_size=1000"),
      ]);

      setTests(testsRes.data || []);
      setStudents(studentsRes.data.results || studentsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load belt tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (test: any) => {
    setSelectedTest(test);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedTest(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (refresh: boolean) => {
    setDialogOpen(false);
    setSelectedTest(null);
    if (refresh) {
      fetchData();
    }
  };

  const upcomingTests = tests.filter((t) => {
    const testDate = new Date(t.test_date);
    const now = new Date();

    // Set cutoff time to 7 PM today
    const cutoffTime = new Date();
    cutoffTime.setHours(19, 0, 0, 0); // 7 PM

    // If test is pending and (future date OR today before 7 PM)
    if (t.result === "pending") {
      // Future dates
      if (testDate > now) return true;

      // Today's tests - show in upcoming if before 7 PM
      const isToday = testDate.toDateString() === now.toDateString();
      if (isToday && now < cutoffTime) return true;
    }

    return false;
  });

  const pastTests = tests.filter((t) => {
    const testDate = new Date(t.test_date);
    const now = new Date();

    // Set cutoff time to 7 PM today
    const cutoffTime = new Date();
    cutoffTime.setHours(19, 0, 0, 0); // 7 PM

    // Past if: completed (passed/failed) OR past date OR today after 7 PM
    if (t.result !== "pending") return true;

    // Past dates
    if (testDate < now) {
      const isToday = testDate.toDateString() === now.toDateString();
      // If today, only past if after 7 PM
      if (isToday) {
        return now >= cutoffTime;
      }
      return true;
    }

    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Belt Tests</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Schedule and track belt promotion tests</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 w-full sm:w-auto">
            <ExportBeltTestDialog />
            <Button onClick={handleAdd} className="gap-2 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              Schedule Test
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Tests</p>
              <p className="text-2xl font-bold">{tests.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{upcomingTests.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {tests.filter((t) => t.result === "passed").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {upcomingTests.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold">Upcoming Tests</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingTests.map((test) => {
              const student = students.find((s) => s.id === test.student);
              return (
                <BeltTestCard
                  key={test.id}
                  test={test}
                  student={student}
                  onEdit={handleEdit}
                  onDelete={fetchData}
                />
              );
            })}
          </div>
        </div>
      )}

      {pastTests.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold">Past Tests</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {pastTests.map((test) => {
              const student = students.find((s) => s.id === test.student);
              return (
                <BeltTestCard
                  key={test.id}
                  test={test}
                  student={student}
                  onEdit={handleEdit}
                  onDelete={fetchData}
                />
              );
            })}
          </div>
        </div>
      )}

      {tests.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No belt tests scheduled yet</p>
            {isAdmin && (
              <Button onClick={handleAdd} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule First Test
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <BeltTestDialog
        open={dialogOpen}
        test={selectedTest}
        students={students}
        onClose={handleDialogClose}
      />
    </div>
  );
};

export default BeltTests;
