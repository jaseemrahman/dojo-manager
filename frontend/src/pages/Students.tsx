import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Download, Phone, User, Calendar as CalendarIcon, MapPin, Award, Banknote, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import StudentDialog from "@/components/students/StudentDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewImageObj, setViewImageObj] = useState<{ src: string; alt: string } | null>(null);
  const itemsPerPage = 25; // Matching backend

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Initial load
    fetchStudents(true);
  }, [currentPage]);

  useEffect(() => {
    // Search update (background) - also reload when search is cleared
    const timer = setTimeout(() => {
      fetchStudents(false);
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStudents = async (showLoading = true, pageVal = currentPage, searchVal = searchQuery) => {
    try {
      if (showLoading) setLoading(true);
      // Backend pagination enabled. Page size is 1 as per request.
      const response = await api.get(`/students/?page=${pageVal}&search=${searchVal}`);

      // Handle paginated response
      if (response.data.results) {
        setStudents(response.data.results);
        const count = response.data.count;

        // Infer page size from first page results if possible to support backend changes
        let size = itemsPerPage;
        if (currentPage === 1 && response.data.results.length > 0 && count > response.data.results.length) {
          size = response.data.results.length;
        } else if (count > 0 && response.data.results.length > 0) {
          // If not page 1, we can't easily infer size if we don't know it.
          // But if we are consistent, we use the stored/hardcoded one.
          // If backend is 1, and we have 3 items. Page 1: 1 item. Size=1. Total=3.
          // If we use size 25: 3/25 = 1 page. Wrong.
          // We need to detect if size 25 is wrong.
          // If results.length (1) < size (25) AND count (3) > results.length (1)...
          // Then size must be smaller than 25.
          if (response.data.results.length < size && count > (currentPage * response.data.results.length)) {
            // This logic is tricky for middle pages.
            // let's stick to simple inference on page 1.
          }
          // Actually, if backend returns `next`, we have more pages.
        }

        // Updating total pages.
        // If we extracted a size from page 1, use it.
        // If we are on page > 1, we must have had a correct totalPages from page 1?
        // No, state doesn't persist well if we don't save pageSize.
        // Let's rely on a simpler calc:
        // If we have 'next', totalPages must be at least currentPage + 1.

        // Let's strictly use the inferred logic on Page 1.
        if (currentPage === 1 && response.data.results.length > 0) {
          const returnedSize = response.data.results.length;
          // If count > returnedSize, then returnedSize is likely the page limit.
          // If count == returnedSize, it fits in one page.
          size = returnedSize;
        } else {
          // For usage on page 2+, we need to know the size. 
          // If we didn't save it, we might be stuck.
          // But usually user hits page 1 first.
          // We'll update a ref or state for pageSize?
          // For now let's just use what we have or 25.
          // If the user went to page 2, they saw page 1.
        }

        // Improved: Update totalPages whenever we can guess size.
        // If results.length < count and we are on page 1, size = results.length.
        if (currentPage === 1 && count > response.data.results.length && response.data.results.length > 0) {
          size = response.data.results.length;
          setTotalPages(Math.ceil(count / size));
        } else if (currentPage === 1) {
          // count <= results.length. So 1 page.
          setTotalPages(1);
        }
        // If currentPage > 1, do we update totalPages? We should keep it.
      } else {
        // Fallback for non-paginated (flat list)
        setStudents(response.data || []);
        setTotalPages(1);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  const handleEdit = (student: any) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedStudent(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (refresh: boolean) => {
    setDialogOpen(false);
    setSelectedStudent(null);
    if (refresh) {
      fetchStudents(false);
    }
  };

  const confirmDelete = (student: any) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      await api.delete(`/students/${studentToDelete.id}/`);
      toast({
        title: "Student deleted",
        description: "Student has been successfully removed",
      });
      fetchStudents(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  // Pagination Logic handled by backend
  // const indexOfLastStudent = currentPage * itemsPerPage; 
  // ... removed client-side logic

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
    return belt?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown";
  };

  const exportStudentsPDF = async () => {
    const doc = new jsPDF();
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
      doc.addImage(logoBase64, "JPEG", 14, 15, 25, 25);
      yPosition = 25;

      // Header with Logo
      doc.setFontSize(22);
      doc.setTextColor(220, 38, 38);
      doc.text("Master's Taekwon-Do Academy", 45, 25);

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Student Directory", 45, 32);
      doc.text(`${new Date().toLocaleDateString()}`, 45, 38);
    } catch (error) {
      // Fallback without logo
      doc.setFontSize(22);
      doc.setTextColor(220, 38, 38);
      doc.text("Taekwondo Institute", 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Student Directory", 14, 28);
      doc.text(`${new Date().toLocaleDateString()}`, 14, 34);
    }

    const tableData = students.map((s, index) => [
      index + 1,
      s.name,
      s.age,
      s.gender === "male" ? "M" : s.gender === "female" ? "F" : "O",
      formatBeltName(s.current_belt),
      s.phone_number,
      s.instructor_name || "-"
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["#", "Name", "Age", "Gender", "Belt", "Phone", "Instructor"]],
      body: tableData,
      headStyles: { fillColor: [220, 38, 38] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40, fontStyle: 'bold' },
        4: { cellWidth: 30 },
      }
    });
    doc.save("Students_List.pdf");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Students</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage student records and profiles
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {isAdmin && (
            <Button variant="outline" onClick={() => exportStudentsPDF()} className="gap-2 flex-1 sm:flex-none">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          <Button onClick={handleAdd} className="gap-2 flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Search Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, belt, instructor, or registration number..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={async () => {
                  setSearchQuery("");
                  setCurrentPage(1);
                  fetchStudents(true, 1, "");
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      <div className="relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center backdrop-blur-[1px] rounded-lg">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
              {searchQuery ? "No students found matching your search" : "No students added yet"}
            </div>
          ) : (
            students.map((student) => (
              <Card
                key={student.id}
                className="group overflow-hidden hover:shadow-elevated transition-all cursor-pointer border-border/50 hover:border-primary/50"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <CardContent className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <Avatar
                      className="h-16 w-16 border-2 border-background shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (student.profile_photo) {
                          setViewImageObj({ src: student.profile_photo, alt: student.name });
                        }
                      }}
                    >
                      <AvatarImage src={student.profile_photo} alt={student.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                        {student.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className={`${getBeltColor(student.current_belt)} border-0 shadow-sm`}>
                      {formatBeltName(student.current_belt)}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-lg leading-none group-hover:text-primary transition-colors line-clamp-1" title={student.name}>{student.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="capitalize">{student.gender}</span>
                      <span>•</span>
                      <span>{student.age} years</span>
                    </div>
                    {student.registration_number && (
                      <div className="text-xs font-mono font-semibold">
                        <span className="text-red-600">Reg NO:</span> <span className="text-primary">{student.registration_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm mt-2">
                    {/* Phone */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 flex justify-center flex-shrink-0"><Phone className="h-3.5 w-3.5" /></div>
                      <span className="break-words">{student.phone_number || '-'}</span>
                    </div>

                    {/* Guardian */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 flex justify-center flex-shrink-0"><User className="h-3.5 w-3.5" /></div>
                      <span className="break-words">Guardian: {student.guardian_name || '-'}</span>
                    </div>

                    {/* Joined Date */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 flex justify-center flex-shrink-0"><CalendarIcon className="h-3.5 w-3.5" /></div>
                      <span className="break-words">Joined: {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</span>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 flex justify-center flex-shrink-0"><MapPin className="h-3.5 w-3.5" /></div>
                      <span className="break-words">
                        {student.address || ''}
                        {student.district ? `${student.address ? ', ' : ''}${student.district}` : ''}
                        {student.state ? `, ${student.state}` : ''}
                      </span>
                    </div>

                    {/* TAI Certification */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 flex justify-center flex-shrink-0"><Award className="h-3.5 w-3.5" /></div>
                      <span className="break-words">TAI Cert: {student.latest_tai_certification || '-'}</span>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 flex justify-center flex-shrink-0"><User className="h-3.5 w-3.5" /></div>
                      <span className="break-words">Instructor: {student.instructor_name || '-'}</span>
                    </div>

                    {/* DOB */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 flex justify-center flex-shrink-0"><CalendarIcon className="h-3.5 w-3.5" /></div>
                      <span className="break-words">DOB: {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</span>
                    </div>

                    {/* Fee Structure */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 flex justify-center flex-shrink-0"><Banknote className="h-3.5 w-3.5" /></div>
                      <span className="break-words">Fee: {student.fee_structure === '4_classes_1000' ? '4 classes/week - ₹1000' : '2 classes/week - ₹700'}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex justify-end gap-1 pt-2 mt-auto border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => handleEdit(student)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => confirmDelete(student)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{studentToDelete?.name}</span>? This action is permanent and cannot be undone.
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

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewImageObj} onOpenChange={(open) => !open && setViewImageObj(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
          <div className="relative">
            <img
              src={viewImageObj?.src}
              alt={viewImageObj?.alt}
              className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain bg-black/50"
            />
            <Button
              className="absolute -top-4 -right-4 rounded-full"
              size="icon"
              variant="secondary"
              onClick={() => setViewImageObj(null)}
            >
              <span className="text-xl">×</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StudentDialog
        open={dialogOpen}
        student={selectedStudent}
        onClose={handleDialogClose}
      />
    </div>
  );
};

export default Students;
