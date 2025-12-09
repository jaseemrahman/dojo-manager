import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Check, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ExportAttendanceDialog } from "@/components/attendance/ExportAttendanceDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Attendance = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState(new Map());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const formatBeltName = (belt: string) => {
    const beltMap: Record<string, string> = {
      white: "White",
      yellow_stripe: "Yellow Stripe",
      yellow: "Yellow",
      green_stripe: "Green Stripe",
      green: "Green",
      blue_stripe: "Blue Stripe",
      blue: "Blue",
      red_stripe: "Red Stripe",
      red: "Red",
      red_black: "Red Black",
      black_1st_dan: "Black 1st Dan",
      black_2nd_dan: "Black 2nd Dan",
      black_3rd_dan: "Black 3rd Dan",
      black_4th_dan: "Black 4th Dan",
      black_5th_dan: "Black 5th Dan",
    };
    return beltMap[belt] || belt.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  // Filter students based on admission date vs selected date
  const activeStudents = students.filter((s: any) => {
    if (!s.is_active) return false;
    if (!s.admission_date) return true;
    return new Date(s.admission_date) <= new Date(selectedDate);
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, students]);

  const fetchStudents = async () => {
    try {
      const response = await api.get("/students/?page_size=1000");
      // Handle both paginated and non-paginated responses
      const studentsData = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setStudents(studentsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      // Fetch only attendance for selected date
      const response = await api.get(`/attendance/?date=${selectedDate}&page_size=1000`);
      const allData = response.data.results || response.data;

      // Populate attendance map
      const attendanceMap = new Map<string, string>();
      allData.forEach((record: any) => {
        attendanceMap.set(record.student.toString(), record.status);
      });

      setAttendance(attendanceMap);
      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const [lateMarkStudentId, setLateMarkStudentId] = useState<string | null>(null);
  const [lateRemarks, setLateRemarks] = useState("");

  const markAttendance = async (studentId: string, status: string, remarks: string = "") => {
    if (!isAdmin) return;

    // If status is late and no remarks passed (checking if this is the initial call), open dialog
    if (status === 'late' && !lateMarkStudentId && remarks === "") {
      setLateMarkStudentId(studentId);
      setLateRemarks("");
      return; // Wait for dialog confirmation
    }

    // Validate date is within 7 days
    const selected = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - selected.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      toast({
        title: "Invalid Date",
        description: "You can only edit attendance for the past 7 days",
        variant: "destructive",
      });
      return;
    }

    if (diffDays < 0) {
      toast({
        title: "Invalid Date",
        description: "Cannot mark attendance for future dates",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the local map to check existence instead of re-fetching everything
      // We need to upgrade our map to store ID as well or fetch just for this student
      // Optimisation: We can just use the query we likely already did or filter
      // But to be safe and simple, let's look at the current state 'attendance' map.
      // Wait, the map only stores status string. We should probably store the whole object or at least ID.

      // Let's first try to find the ID from the current selected date's attendance list if we had it.
      // But we only have the map. 
      // Let's re-fetch strictly for this student and date to be safe and avoid the massive fetch.
      const checkResponse = await api.get(`/attendance/?student=${studentId}&date=${selectedDate}`);
      const checkData = checkResponse.data.results || checkResponse.data;
      const existing = checkData.length > 0 ? checkData[0] : null;

      if (existing) {
        await api.patch(`/attendance/${existing.id}/`, { status, remarks });
      } else {
        await api.post("/attendance/", {
          student: parseInt(studentId),
          date: selectedDate,
          status,
          remarks,
        });
      }

      toast({
        title: "Attendance marked",
        description: `Marked as ${status}${remarks ? ' with remarks' : ''}`,
      });

      fetchAttendance(); // Refresh attendance after marking
      // Close dialog if open
      setLateMarkStudentId(null);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const confirmMarkLate = () => {
    if (lateMarkStudentId) {
      markAttendance(lateMarkStudentId, 'late', lateRemarks);
    }
  };

  const markAllPresent = async () => {
    if (!isAdmin) return;

    try {
      setSaving(true);
      const promises = [];
      for (const student of students) {
        if (!attendance.has(student.id.toString()) && !attendance.has(student.id)) {
          // Create only if not exists
          promises.push(api.post("/attendance/", {
            student: student.id,
            date: selectedDate,
            status: "present"
          }));
        }
      }
      await Promise.all(promises);

      toast({
        title: "Success",
        description: "Marked all remaining students as present",
      });
      fetchAttendance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark all as present",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const styles = {
      present: "bg-green-100 text-green-800 border-green-300",
      absent: "bg-red-100 text-red-800 border-red-300",
      late: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };

    const icons = {
      present: <Check className="h-3 w-3" />,
      absent: <X className="h-3 w-3" />,
      late: <CalendarIcon className="h-3 w-3" />,
    };

    return (
      <Badge className={styles[status as keyof typeof styles]} variant="outline">
        <span className="flex items-center gap-1">
          {icons[status as keyof typeof icons]}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  // Filter students based on search term
  const filteredStudents = activeStudents.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate attendance stats from activeStudents
  const presentCount = activeStudents.filter(s => attendance.get(s.id.toString()) === "present").length;
  const absentCount = activeStudents.filter(s => attendance.get(s.id.toString()) === "absent").length;
  const lateCount = activeStudents.filter(s => attendance.get(s.id.toString()) === "late").length;

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Attendance</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Mark and track student attendance</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{activeStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full sm:w-auto"
            />
            {isAdmin && (
              <>
                <Button
                  onClick={markAllPresent}
                  disabled={saving || new Date(selectedDate).toDateString() !== new Date().toDateString()}
                  variant="outline"
                >
                  {saving ? "Saving..." : "Mark All Present"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedDate(new Date().toISOString().split("T")[0]);
                      fetchStudents();
                      fetchAttendance();
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <ExportAttendanceDialog students={students} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:gap-4">
            <CardTitle className="text-lg sm:text-xl">Mark Attendance</CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Input
                type="text"
                placeholder="Search student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found matching "{searchTerm}"
              </div>
            ) : (
              filteredStudents.map((student) => {
                const status = attendance.get(student.id.toString());

                return (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{student.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formatBeltName(student.current_belt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      {!isAdmin && (
                        <>
                          <div className="sm:hidden">{getStatusBadge(status)}</div>
                          <div className="hidden sm:block">{getStatusBadge(status)}</div>
                        </>
                      )}

                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className={`gap-1 flex-1 sm:flex-none ${status === "present"
                              ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-600 ring-offset-2"
                              : "text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                              }`}
                            variant={status === "present" ? "default" : "outline"}
                            onClick={() => markAttendance(student.id, "present")}
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Present</span>
                            <span className="sm:hidden">P</span>
                          </Button>
                          <Button
                            size="sm"
                            className={`gap-1 flex-1 sm:flex-none ${status === "absent"
                              ? "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-600 ring-offset-2"
                              : "text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
                              }`}
                            variant={status === "absent" ? "default" : "outline"}
                            onClick={() => markAttendance(student.id, "absent")}
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Absent</span>
                            <span className="sm:hidden">A</span>
                          </Button>
                          <Button
                            size="sm"
                            className={`gap-1 flex-1 sm:flex-none ${status === "late"
                              ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-500 ring-offset-2"
                              : "text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                              }`}
                            variant={status === "late" ? "default" : "outline"}
                            onClick={() => markAttendance(student.id, "late")}
                          >
                            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Late</span>
                            <span className="sm:hidden">L</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }))}
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!lateMarkStudentId} onOpenChange={(open) => !open && setLateMarkStudentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Late - Remarks (Optional)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Reason for being late..."
              value={lateRemarks}
              onChange={(e) => setLateRemarks(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLateMarkStudentId(null)}>Cancel</Button>
              <Button onClick={() => confirmMarkLate()}>Confirm Late</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
