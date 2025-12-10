import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportFeesDialogProps {
  students: any[];
  selectedMonth: number;
  selectedYear: number;
}

export const ExportFeesDialog = ({ students, selectedMonth, selectedYear }: ExportFeesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await api.get("/fees/");
      let allFees = response.data;

      // Check if we're exporting for a specific student with "All" status
      const isIndividualStudentAllStatus = selectedStudent !== "all" && paymentStatus === "all";

      if (isIndividualStudentAllStatus) {
        // Individual student - show complete fee history
        const student = students.find(s => s.id.toString() === selectedStudent);
        if (!student || !student.admission_date) {
          toast({
            title: "Error",
            description: "Student or admission date not found",
            variant: "destructive",
          });
          return;
        }

        const admDate = new Date(student.admission_date);
        const currentDate = new Date();
        const feeStructureAmount = student.fee_structure === '4_classes_1000' ? 1000 : 700;

        // Create a map of existing fees
        const feeMap = new Map();
        allFees.forEach((fee: any) => {
          if (fee.student.toString() === selectedStudent) {
            const key = `${fee.year}-${fee.month}`;
            feeMap.set(key, fee);
          }
        });

        // Generate all months from admission to current
        const completeFeesData = [];
        let currentMonth = admDate.getMonth() + 1;
        let currentYear = admDate.getFullYear();
        const endMonth = currentDate.getMonth() + 1;
        const endYear = currentDate.getFullYear();

        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
          const key = `${currentYear}-${currentMonth}`;
          const existingFee = feeMap.get(key);

          if (existingFee) {
            completeFeesData.push(existingFee);
          } else {
            // Create unpaid fee entry
            completeFeesData.push({
              student: parseInt(selectedStudent),
              month: currentMonth,
              year: currentYear,
              amount: feeStructureAmount,
              status: 'unpaid',
              payment_method: null,
              paid_date: null,
              partial_amount_paid: 0
            });
          }

          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
        }

        // Prepare PDF for individual student
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

          doc.setFontSize(22);
          doc.setTextColor(220, 38, 38);
          doc.text("Master's Taekwon-Do Academy", 45, 25);

          doc.setFontSize(12);
          doc.setTextColor(100);
          doc.text(`Complete Fee Report - ${student.name}`, 45, 35);
          doc.text(`${new Date().toLocaleDateString()}`, 45, 40);
        } catch (error) {
          doc.setFontSize(22);
          doc.setTextColor(220, 38, 38);
          doc.text("Taekwon-Do Academy", 14, 20);

          doc.setFontSize(12);
          doc.setTextColor(100);
          doc.text(`Complete Fee Report - ${student.name}`, 14, 30);
          doc.text(`${new Date().toLocaleDateString()}`, 14, 35);
        }

        // Table Data with complete fee history
        const tableData = completeFeesData.map((fee: any, index: number) => {
          const actualAmount = fee.amount || feeStructureAmount;
          const partialPaid = fee.partial_amount_paid || 0;

          let remaining = 0;
          if (fee.status === 'paid') remaining = 0;
          else if (fee.status === 'partial') remaining = actualAmount - partialPaid;
          else remaining = actualAmount;

          return [
            index + 1,
            `${months[fee.month - 1]} ${fee.year}`,
            `Rs. ${actualAmount}`,
            fee.status.charAt(0).toUpperCase() + fee.status.slice(1),
            `Rs. ${remaining}`,
            fee.payment_method ? (fee.payment_method === 'upi' ? 'UPI' : 'Cash') : "-",
            fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : "-"
          ];
        });

        autoTable(doc, {
          startY: 50,
          head: [["#", "Month/Year", "Fee", "Status", "Remaining", "Method", "Date"]],
          body: tableData,
          headStyles: { fillColor: [220, 38, 38], fontSize: 8 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30 },
            5: { cellWidth: 25 },
            6: { cellWidth: 30 }
          }
        });

        // Stats
        const totalPaid = completeFeesData.reduce((sum: number, f: any) => {
          if (f.status === 'paid') return sum + parseFloat(f.amount || feeStructureAmount);
          if (f.status === 'partial') return sum + parseFloat(f.partial_amount_paid || 0);
          return sum;
        }, 0);

        const totalRemaining = completeFeesData.reduce((sum: number, f: any) => {
          const amt = parseFloat(f.amount || feeStructureAmount);
          if (f.status === 'paid') return sum;
          if (f.status === 'partial') return sum + (amt - parseFloat(f.partial_amount_paid || 0));
          return sum + amt;
        }, 0);

        const finalY = (doc as any).lastAutoTable.finalY || 50;
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Paid: Rs. ${Number(totalPaid).toFixed(2)}`, 14, finalY + 10);
        doc.text(`Total Remaining: Rs. ${Number(totalRemaining).toFixed(2)}`, 100, finalY + 10);

        // Footer
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

        doc.save(`Complete_Fee_Report_${student.name.replace(/\s+/g, '_')}.pdf`);

        toast({
          title: "Export successful",
          description: `Downloaded complete fee report for ${student.name} (${completeFeesData.length} months).`,
        });

      } else {
        // Original logic for monthly reports or filtered reports
        let data = allFees.filter((f: any) =>
          f.month === selectedMonth &&
          f.year === selectedYear
        );

        // Apply student filter
        if (selectedStudent !== "all") {
          data = data.filter((f: any) => f.student.toString() === selectedStudent);
        }

        // Apply payment status filter
        if (paymentStatus !== "all") {
          data = data.filter((f: any) => f.status === paymentStatus);
        }

        if (!data || data.length === 0) {
          toast({
            title: "No records found",
            description: "No fee records match the selected filters.",
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
          doc.text(`Fee Report - ${months[selectedMonth - 1]} ${selectedYear}`, 45, 35);
          doc.text(`${new Date().toLocaleDateString()}`, 45, 40);
        } catch (error) {
          // Fallback without logo
          doc.setFontSize(22);
          doc.setTextColor(220, 38, 38);
          doc.text("Taekwondo Institute", 14, 20);

          doc.setFontSize(12);
          doc.setTextColor(100);
          doc.text(`Fee Report - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 30);
          doc.text(`${new Date().toLocaleDateString()}`, 14, 35);
        }

        // Table Data
        const tableData = data.map((fee: any, index: number) => {
          const student = students.find(s => s.id === fee.student);
          const feeAmount = student?.fee_structure === '4_classes_1000' ? 1000 : 700;
          const actualAmount = fee.amount ? parseFloat(fee.amount) : feeAmount;
          const partialPaid = fee.partial_amount_paid ? parseFloat(fee.partial_amount_paid) : 0;

          // Calculate paid and remaining
          let paidAmount = 0;
          let remaining = 0;

          if (fee.status === 'paid') {
            paidAmount = actualAmount;
            remaining = 0;
          } else if (fee.status === 'partial') {
            paidAmount = partialPaid;
            remaining = actualAmount - partialPaid;
          } else {
            paidAmount = 0;
            remaining = actualAmount;
          }

          return [
            index + 1,
            student?.name || "N/A",
            `Rs. ${actualAmount}`,
            `Rs. ${paidAmount}`,
            `Rs. ${remaining}`,
            fee.status.charAt(0).toUpperCase() + fee.status.slice(1),
            fee.payment_method ? (fee.payment_method === 'upi' ? 'UPI' : 'Cash') : '-',
            fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : "-"
          ];
        });

        autoTable(doc, {
          startY: 50,
          head: [["#", "Student", "Fee", "Paid (Partial)", "Remaining", "Status", "Method", "Date"]],
          body: tableData,
          headStyles: { fillColor: [220, 38, 38] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 35, fontStyle: 'bold' },
            2: { cellWidth: 20 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: 18 },
            7: { cellWidth: 25 }
          }
        });

        // Stats - Total Collected on left side
        const totalCollected = data.reduce((sum: number, f: any) => {
          if (f.status === 'paid') return sum + parseFloat(f.amount);
          if (f.status === 'partial') return sum + parseFloat(f.partial_amount_paid || 0);
          return sum;
        }, 0);

        const finalY = (doc as any).lastAutoTable.finalY || 50;

        // Total Collected - left aligned below table
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(`Total Collected: Rs. ${totalCollected.toFixed(2)}`, 14, finalY + 10);

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

        doc.save(`Fee_Report_${months[selectedMonth - 1]}_${selectedYear}.pdf`);

        toast({
          title: "Export successful",
          description: `Downloaded fee report for ${data.length} records.`,
        });
      }

      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export fee records",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Fee Records</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue />
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
            <Label>Payment Status</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
