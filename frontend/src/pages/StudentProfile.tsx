import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import StudentDialog from "@/components/students/StudentDialog";
import StudentEventDialog from "@/components/students/StudentEventDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Phone, MapPin, Calendar, Award, GraduationCap, Save, Download, Trash2, Edit, Plus, Trophy } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [beltTests, setBeltTests] = useState<any[]>([]);
  const [studentEvents, setStudentEvents] = useState<any[]>([]);
  const [editingCertNumber, setEditingCertNumber] = useState<Record<string, string>>({});
  const [savingCertNumber, setSavingCertNumber] = useState<Record<string, boolean>>({});
  const [attendanceMonth, setAttendanceMonth] = useState<string>("all");
  const [attendanceYear, setAttendanceYear] = useState<string>(new Date().getFullYear().toString());
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0,
  });
  const [feeStats, setFeeStats] = useState({
    totalPaid: 0,
    totalPending: 0,
  });
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [viewEventImage, setViewEventImage] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (id) {
      fetchStudentProfile();
    }
  }, [id]);

  // Filter attendance based on month/year selection
  useEffect(() => {
    if (attendanceMonth === "all") {
      setFilteredAttendance(attendanceData);
      const present = attendanceData.filter((a) => a.status === "present" || a.status === "late").length;
      const late = attendanceData.filter((a) => a.status === "late").length;
      const absent = attendanceData.filter((a) => a.status === "absent").length;
      const total = attendanceData.length;
      const percentage = total > 0 ? (present / total) * 100 : 0;
      setAttendanceStats({ present, absent, late, total, percentage });
    } else {
      const filtered = attendanceData.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() + 1 === parseInt(attendanceMonth) &&
          recordDate.getFullYear() === parseInt(attendanceYear)
        );
      });
      setFilteredAttendance(filtered);
      const present = filtered.filter((a) => a.status === "present" || a.status === "late").length;
      const late = filtered.filter((a) => a.status === "late").length;
      const absent = filtered.filter((a) => a.status === "absent").length;
      const total = filtered.length;
      const percentage = total > 0 ? (present / total) * 100 : 0;
      setAttendanceStats({ present, absent, late, total, percentage });
    }
  }, [attendanceMonth, attendanceYear, attendanceData]);

  const fetchStudentProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Fetch student details
      const studentRes = await api.get(`/students/${id}/`);
      setStudent(studentRes.data);

      // Fetch attendance records
      // Filter by student ID manually since API returns all for now
      // Or if I added filtering to API: /attendance/?student=ID
      // For now,      // Fetch attendance
      const attendanceRes = await api.get("/attendance/?page_size=1000");
      const attendanceRecords = attendanceRes.data.results || attendanceRes.data;

      const studentAttendance = attendanceRecords
        .filter((a: any) => a.student === parseInt(id!))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate attendance stats (count 'late' as present)
      const total = studentAttendance.length;
      const present = studentAttendance.filter((a: any) => a.status === "present" || a.status === "late").length;
      const late = studentAttendance.filter((a: any) => a.status === "late").length;
      const absent = studentAttendance.filter((a: any) => a.status === "absent").length;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      setAttendanceStats({ present, absent, late, total, percentage });
      setAttendanceData(studentAttendance || []);

      // Fetch fee records
      const feeRes = await api.get("/fees/?page_size=1000");
      // Filter fees by admission date
      let feesList = (feeRes.data.results || feeRes.data || []).filter((f: any) => f.student === parseInt(id!));

      if (studentRes.data.admission_date) {
        const admDate = new Date(studentRes.data.admission_date);
        feesList = feesList.filter((f: any) => {
          if (f.year < admDate.getFullYear()) return false;
          if (f.year === admDate.getFullYear() && f.month < (admDate.getMonth() + 1)) return false;
          return true;
        });
      }

      const feeRecords = feesList.sort((a: any, b: any) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setFeeData(feeRecords);

      // Fee Stats
      const totalPaid = feeRecords
        .filter((f: any) => f.status === "paid" || f.status === "partial")
        .reduce((sum: number, f: any) => {
          return sum + (f.status === "partial" ? parseFloat(f.partial_amount_paid || 0) : parseFloat(f.amount));
        }, 0);

      const totalPending = feeRecords
        .filter((f: any) => f.status === "unpaid" || f.status === "partial")
        .reduce((sum: number, f: any) => {
          const feeAmount = studentRes.data.fee_structure === '4_classes_1000' ? 1000 : 700;
          const actualAmount = f.amount ? parseFloat(f.amount) : feeAmount;
          const paid = f.partial_amount_paid ? parseFloat(f.partial_amount_paid) : 0;
          return sum + (actualAmount - paid);
        }, 0);

      setFeeStats({ totalPaid, totalPending });

      // Fetch belt tests
      const testsRes = await api.get("/belt-tests/?page_size=1000");
      const testData = (testsRes.data.results || testsRes.data)
        .filter((t: any) => t.student === parseInt(id!))
        .sort((a: any, b: any) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());

      setBeltTests(testData || []);

      // Fetch student events
      const eventsRes = await api.get(`/student-events/?student=${id}`);
      setStudentEvents(eventsRes.data.results || eventsRes.data || []);

      // Initialize editing state
      const certNumbers: Record<string, string> = {};
      testData.forEach((test: any) => {
        certNumbers[test.id] = test.certification_no || "";
      });
      setEditingCertNumber(certNumbers);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        toast({
          title: "Student not found",
          description: "This student may have been deleted.",
          variant: "destructive",
        });
        navigate("/students", { replace: true });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load student profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      white: "bg-gray-200 text-gray-800",
      yellow_stripe: "bg-yellow-300 text-yellow-900",
      yellow: "bg-yellow-400 text-yellow-900",
      green_stripe: "bg-green-400 text-white",
      green: "bg-green-500 text-white",
      blue_stripe: "bg-blue-400 text-white",
      blue: "bg-blue-500 text-white",
      red_stripe: "bg-red-400 text-white",
      red: "bg-red-500 text-white",
      red_black: "bg-gradient-to-r from-red-600 to-gray-900 text-white",
      black_1st_dan: "bg-gray-900 text-white",
      black_2nd_dan: "bg-gray-900 text-white",
      black_3rd_dan: "bg-gray-900 text-white",
      black_4th_dan: "bg-gray-900 text-white",
      black_5th_dan: "bg-gray-900 text-white",
    };
    return colors[belt] || "bg-gray-200 text-gray-800";
  };

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
    return beltMap[belt] || belt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1];
  };

  const handleCertNumberChange = (testId: string, value: string) => {
    // Validate: alphanumeric and hyphens only, max 20 chars
    const sanitized = value.slice(0, 20).replace(/[^a-zA-Z0-9-]/g, "");
    setEditingCertNumber((prev) => ({
      ...prev,
      [testId]: sanitized,
    }));
  };

  const handleSaveCertNumber = async (testId: string) => {
    try {
      setSavingCertNumber((prev) => ({ ...prev, [testId]: true }));

      await api.patch(`/belt-tests/${testId}/`, {
        certification_no: editingCertNumber[testId] || null
      });

      // Update local state
      setBeltTests((prev) =>
        prev.map((test) =>
          test.id === testId
            ? { ...test, certification_no: editingCertNumber[testId] }
            : test
        )
      );

      // Refresh student data to update latest_tai_certification
      await fetchStudentProfile(false);

      toast({
        title: "Success",
        description: "Certification number updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update certification number",
        variant: "destructive",
      });
    } finally {
      setSavingCertNumber((prev) => ({ ...prev, [testId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    try {
      await api.delete(`/students/${student.id}/`);
      toast({
        title: "Student deleted",
        description: "Student has been successfully removed",
      });
      navigate("/students", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: "bg-green-500/10 text-green-700 dark:text-green-400",
      absent: "bg-red-500/10 text-red-700 dark:text-red-400",
      late: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      paid: "bg-green-500/10 text-green-700 dark:text-green-400",
      unpaid: "bg-red-500/10 text-red-700 dark:text-red-400",
      partial: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      passed: "bg-green-500/10 text-green-700 dark:text-green-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
      pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    };
    return styles[status] || "";
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 15;

      // Load and add logo
      const loadImage = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg"));
          };
          img.onerror = reject;
          img.src = url;
        });
      };

      try {
        const logoBase64 = await loadImage("/images/mta-logo.jpeg");
        const logoWidth = 30;
        const logoHeight = 30;
        doc.addImage(logoBase64, "JPEG", 14, yPosition, logoWidth, logoHeight);

        // Title next to logo
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Master's Taekwon-Do Academy", 50, yPosition + 12);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Student Profile Report", 50, yPosition + 20);
        yPosition += 40;
      } catch (imgError) {
        // Fallback if logo fails to load
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Student Profile Report", pageWidth / 2, yPosition, { align: "center" });
        yPosition += 15;
      }

      // Separator line
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.5);
      doc.line(14, yPosition, pageWidth - 14, yPosition);
      yPosition += 10;

      // Basic Information Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Basic Information", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const basicInfo = [
        ["Student Name:", student.name],
        ["Registration Number:", student.registration_number || "N/A"],
        ["Gender:", student.gender.charAt(0).toUpperCase() + student.gender.slice(1)],
        ["Date of Birth:", new Date(student.date_of_birth).toLocaleDateString('en-GB')],
        ["Age:", `${student.age} years`],
        ["Guardian Name:", student.guardian_name],
        ["Phone Number:", student.phone_number],
        ["Address:", student.address || "Not provided"],
        ["State:", student.state || "N/A"],
        ["Admission Date:", new Date(student.admission_date).toLocaleDateString('en-GB')],
        ["Current Belt:", formatBeltName(student.current_belt)],
        ["Instructor Name:", student.instructor_name || "N/A"],
        ["TAI Certification:", student.latest_tai_certification || "N/A"],
        ["Fee Structure:", student.fee_structure === '2_classes_700' ? '2 classes/week - Rs.700' : '4 classes/week - Rs.1000'],
      ];

      basicInfo.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 14, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(value, 70, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Attendance Overview Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Attendance Overview", 14, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: [
          ['Total Present Days', attendanceStats.present.toString()],
          ['Total Absent Days', attendanceStats.absent.toString()],
          ['Total Classes', attendanceStats.total.toString()],
          ['Attendance Percentage', `${attendanceStats.percentage.toFixed(2)}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255 },
        styles: { fontSize: 10 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Attendance History
      if (attendanceData.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Attendance History", 14, yPosition);
        yPosition += 5;

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Status', 'Notes']],
          body: attendanceData.map(a => [
            new Date(a.date).toLocaleDateString('en-GB'),
            a.status.charAt(0).toUpperCase() + a.status.slice(1),
            a.remarks || '-'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 9 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Fee Summary Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Fee Summary", 14, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: [
          ['Total Paid', `Rs.${feeStats.totalPaid.toFixed(2)}`],
          ['Total Pending', `Rs.${feeStats.totalPending.toFixed(2)}`],
          ['Monthly Fee', student.fee_structure === '2_classes_700' ? 'Rs.700' : 'Rs.1000'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255 },
        styles: { fontSize: 10 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Fee History
      let filteredFeeData = [...feeData];
      if (student.admission_date) {
        const admDate = new Date(student.admission_date);
        filteredFeeData = filteredFeeData.filter((f: any) => {
          if (f.year < admDate.getFullYear()) return false;
          if (f.year === admDate.getFullYear() && f.month < (admDate.getMonth() + 1)) return false;
          return true;
        });
      }

      if (filteredFeeData.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Fee History", 14, yPosition);
        yPosition += 5;

        autoTable(doc, {
          startY: yPosition,
          head: [['Month/Year', 'Amount', 'Status', 'Payment Date']],
          body: filteredFeeData.map(fee => [
            `${getMonthName(fee.month)} ${fee.year}`,
            `Rs.${Number(fee.amount).toFixed(2)}`,
            fee.status.charAt(0).toUpperCase() + fee.status.slice(1),
            fee.paid_date ? new Date(fee.paid_date).toLocaleDateString('en-GB') : '-'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 9 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Belt Progress & Certification History
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Belt Progress & Certification History", 14, yPosition);
      yPosition += 8;

      const lastBeltTest = beltTests.length > 0 ? beltTests[0] : null;

      if (lastBeltTest) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Last Belt Test:", 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date(lastBeltTest.test_date).toLocaleDateString('en-GB')}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Tested For: ${formatBeltName(lastBeltTest.tested_for_belt)}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Result: ${lastBeltTest.result.charAt(0).toUpperCase() + lastBeltTest.result.slice(1)}`, 14, yPosition);
        yPosition += 5;
        if (lastBeltTest.certification_number) {
          doc.text(`Certification: ${lastBeltTest.certification_number}`, 14, yPosition);
          yPosition += 5;
        }
        yPosition += 5;
      }

      if (beltTests.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Belt Level', 'Date Issued', 'Result', 'Certification Number']],
          body: beltTests.map(test => [
            formatBeltName(test.tested_for_belt),
            new Date(test.test_date).toLocaleDateString('en-GB'),
            test.result.charAt(0).toUpperCase() + test.result.slice(1),
            test.certification_number || '-'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 9 },
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = `${student.name.replace(/\s+/g, '_')}_ProfileReport.pdf`;
      doc.save(fileName);

      toast({
        title: "Success",
        description: "Student profile exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  const lastBeltTest = beltTests.length > 0 ? beltTests[0] : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Back Button */}
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Student Profile</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Students → {student.name} → Profile
          </p>
        </div>

        <div className="flex gap-2 justify-center sm:justify-end">
          <Button variant="outline" size="icon" onClick={exportToPDF} title="Export PDF">
            <Download className="h-4 w-4" />
          </Button>

          {isAdmin && (
            <>
              <Button variant="outline" size="icon" onClick={() => setEditDialogOpen(true)} title="Edit Student">
                <Edit className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" title="Delete Student">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Student</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <span className="font-semibold text-foreground">{student.name}</span>? This action is permanent and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Basic Information Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative group">
                <Avatar
                  className={`h-24 w-24 sm:h-32 sm:w-32 ${student.profile_photo ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                  onClick={() => student.profile_photo && setViewImageOpen(true)}
                >
                  <AvatarImage src={student.profile_photo} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl sm:text-3xl">
                    {student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {student.profile_photo && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">View</span>
                  </div>
                )}
              </div>
              <Badge className={`${getBeltColor(student.current_belt)} text-sm sm:text-base px-3 sm:px-4 py-1`}>
                {formatBeltName(student.current_belt)}
              </Badge>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Student Name</p>
                <p className="font-semibold text-base sm:text-lg break-words">{student.name}</p>
              </div>
              {student.registration_number && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-semibold text-base sm:text-lg text-primary break-words">{student.registration_number}</p>
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Gender</p>
                <p className="font-semibold text-sm sm:text-base capitalize">{student.gender}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-semibold text-sm sm:text-base">
                  {new Date(student.date_of_birth).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Age</p>
                <p className="font-semibold text-sm sm:text-base">{student.age} years</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  Phone Number
                </p>
                <p className="font-semibold text-sm sm:text-base">{student.phone_number}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Guardian Name</p>
                <p className="font-semibold text-sm sm:text-base break-words">{student.guardian_name}</p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  Admission Date
                </p>
                <p className="font-semibold text-sm sm:text-base">
                  {new Date(student.admission_date).toLocaleDateString('en-GB')}
                </p>
              </div>
              {student.instructor_name && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                    Instructor Name
                  </p>
                  <p className="font-semibold text-sm sm:text-base">{student.instructor_name}</p>
                </div>
              )}
              {student.latest_tai_certification && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                    Latest TAI Certification
                  </p>
                  <p className="font-semibold text-sm sm:text-base break-all">{student.latest_tai_certification}</p>
                </div>
              )}
              {student.national_id && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    National ID
                  </p>
                  <p className="font-semibold text-sm sm:text-base">{student.national_id}</p>
                </div>
              )}

              {student.state && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">State</p>
                  <p className="font-semibold text-sm sm:text-base">{student.state}</p>
                </div>
              )}
              {student.district && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">District</p>
                  <p className="font-semibold text-sm sm:text-base">{student.district}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  Address
                </p>
                <p className="font-semibold text-sm sm:text-base break-words">{student.address || "Not provided"}</p>
              </div>
              {student.admission_fee && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Admission Fee</p>
                  <p className="font-semibold text-sm sm:text-base">₹{student.admission_fee}</p>
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Fee Structure</p>
                <p className="font-semibold text-sm sm:text-base">
                  {student.fee_structure === '2_classes_700'
                    ? '2 classes/week - ₹700'
                    : '4 classes/week - ₹1000'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Participation */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Trophy className="h-5 w-5" />
            Events Participation
          </CardTitle>
          <Button size="sm" onClick={() => setEventDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border text-sm sm:text-base">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No events recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  studentEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.event_name}</TableCell>
                      <TableCell>{new Date(event.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        {event.participation_type === 'winner' ? (
                          <Badge variant="default" className="bg-red-600">Winner</Badge>
                        ) : (
                          <Badge variant="secondary">Participated</Badge>
                        )}
                      </TableCell>
                      <TableCell>{event.result || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              setSelectedEvent(event);
                              setEventDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={async () => {
                              if (confirm("Delete this event?")) {
                                try {
                                  await api.delete(`/student-events/${event.id}/`);
                                  setStudentEvents(prev => prev.filter(e => e.id !== event.id));
                                  toast({ title: "Event deleted" });
                                } catch (e) {
                                  toast({ title: "Error deleting event", variant: "destructive" });
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Attendance Overview</CardTitle>
            <div className="flex gap-2">
              <Select value={attendanceMonth} onValueChange={setAttendanceMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
              <Select value={attendanceYear} onValueChange={setAttendanceYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Present Days</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">{attendanceStats.present}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Absent Days</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Late Days</div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{attendanceStats.late}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Classes</div>
                <div className="text-xl sm:text-2xl font-bold">{attendanceStats.total}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Attendance Rate</div>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {attendanceStats.percentage.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-xs sm:text-sm mb-2 hover:text-primary">
              <ChevronDown className="h-4 w-4" />
              Attendance History
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusBadge(record.status)}
                              variant="secondary"
                            >
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Fee History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Fee Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 rounded-lg bg-green-500/10">
              <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400">
                ₹{feeStats.totalPaid}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Paid</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-red-500/10">
              <p className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-400">
                ₹{feeStats.totalPending}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Pending</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No fee records found
                    </TableCell>
                  </TableRow>
                ) : (
                  feeData.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        {getMonthName(fee.month)} {fee.year}
                      </TableCell>
                      <TableCell>₹{fee.amount || (student.fee_structure === '4_classes_1000' ? 1000 : 700)}</TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadge(fee.status)}
                          variant="secondary"
                        >
                          {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Belt Test History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Award className="h-5 w-5" />
            Belt Test History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Belt Level</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Certification No.</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beltTests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No belt test records found
                    </TableCell>
                  </TableRow>
                ) : (
                  beltTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <Badge className={`${getBeltColor(test.tested_for_belt)}`}>
                          {formatBeltName(test.tested_for_belt)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(test.test_date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadge(test.result)}
                          variant="secondary"
                        >
                          {test.result.charAt(0).toUpperCase() + test.result.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {test.result === 'passed' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCertNumber[test.id] || ""}
                              onChange={(e) => handleCertNumberChange(test.id, e.target.value)}
                              className="bg-transparent border-b border-muted-foreground/30 focus:border-primary focus:outline-none px-1 py-0.5 w-[120px] text-sm"
                              placeholder="Enter number"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {test.result === 'passed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveCertNumber(test.id)}
                            disabled={savingCertNumber[test.id]}
                            className={savingCertNumber[test.id] ? "opacity-50" : ""}
                          >
                            <Save className={`h-4 w-4 ${savingCertNumber[test.id] ? "animate-pulse" : ""}`} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={viewImageOpen} onOpenChange={setViewImageOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
          <div className="relative">
            <img
              src={student.profile_photo}
              alt={student.name}
              className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain bg-black/50"
            />
            <Button
              className="absolute -top-4 -right-4 rounded-full"
              size="icon"
              variant="secondary"
              onClick={() => setViewImageOpen(false)}
            >
              <span className="text-xl">×</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StudentDialog
        open={editDialogOpen}
        student={student}
        onClose={(refresh) => {
          setEditDialogOpen(false);
          if (refresh) fetchStudentProfile(false);
        }}
      />
      <StudentEventDialog
        open={eventDialogOpen}
        studentId={id!}
        event={selectedEvent}
        onClose={(refresh) => {
          setEventDialogOpen(false);
          setSelectedEvent(null);
          if (refresh) {
            // Refresh events list
            api.get(`/student-events/?student=${id}`).then(res => {
              setStudentEvents(res.data.results || res.data || []);
            });
          }
        }}
      />

      <Dialog open={!!viewEventImage} onOpenChange={() => setViewEventImage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
          {viewEventImage && (
            <img
              src={viewEventImage}
              alt="Event"
              className="max-w-full max-h-[90vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default StudentProfile;
