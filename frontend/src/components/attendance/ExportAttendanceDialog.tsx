import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportAttendanceDialogProps {
  students: any[];
}

export const ExportAttendanceDialog = ({ students }: ExportAttendanceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await api.get("/attendance/?page_size=1000");
      const allData = response.data.results || response.data;
      let data = allData.filter((record: any) => {
        const recordDate = record.date;
        return recordDate >= fromDate && recordDate <= toDate;
      });

      // Apply student filter if selected
      if (selectedStudent !== "all") {
        data = data.filter((record: any) => record.student.toString() === selectedStudent);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        data = data.filter((record: any) => record.status === statusFilter);
      }

      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No attendance records found for selected filters.",
          variant: "destructive",
        });
        return;
      }

      // Prepare PDF
      const doc = new jsPDF();

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

        // Header with Logo
        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38);
        doc.text("Master's Taekwon-Do Academy", 45, 25);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Attendance Report`, 45, 32);
        doc.text(`${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`, 45, 38);
      } catch (error) {
        // Fallback without logo
        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38);
        doc.text("Taekwondo Institute", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Attendance Report`, 14, 28);
        doc.text(`${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`, 14, 34);
      }

      // Table Data
      const tableData = data.map((record: any, index: number) => {
        const student = students.find(s => s.id === record.student);
        return [
          index + 1,
          student?.name || "N/A",
          new Date(record.date).toLocaleDateString("en-GB"),
          record.status.charAt(0).toUpperCase() + record.status.slice(1),
          student?.instructor_name || "-",
          record.remarks || "-"
        ];
      });

      autoTable(doc, {
        startY: 50,
        head: [["#", "Student", "Date", "Status", "Instructor", "Remarks"]],
        body: tableData,
        headStyles: { fillColor: [220, 38, 38] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40, fontStyle: 'bold' },
          5: { cellWidth: 40 }
        }
      });

      // Footer with page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      doc.save(`Attendance_Report_${fromDate}_to_${toDate}.pdf`);

      toast({
        title: "Export Successful",
        description: `Downloaded ${data.length} records`,
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export attendance data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Attendance Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student">Student (Optional)</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="present">Present Only</SelectItem>
                  <SelectItem value="absent">Absent Only</SelectItem>
                  <SelectItem value="late">Late Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
