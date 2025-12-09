import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, RefreshCw, Plus, History, CheckCircle, XCircle, IndianRupee, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ExportFeesDialog } from "@/components/fees/ExportFeesDialog";
import { GenerateInvoiceDialog } from "@/components/fees/GenerateInvoiceDialog";
import { generateInvoice } from "@/components/fees/FeeInvoice";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Fees = () => {
  const [searchParams] = useSearchParams();
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [partialPaymentOpen, setPartialPaymentOpen] = useState(false);
  const [selectedFeeForPartial, setSelectedFeeForPartial] = useState<any>(null);
  const [partialAmountInput, setPartialAmountInput] = useState("");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedStudentForInvoice, setSelectedStudentForInvoice] = useState<any>(null);
  const [invoiceDefaultMonth, setInvoiceDefaultMonth] = useState<number | undefined>(undefined);
  const [invoiceDefaultYear, setInvoiceDefaultYear] = useState<number | undefined>(undefined);
  const [allFees, setAllFees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Check URL params for filter
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    fetchStudents();
  }, [searchParams]);

  useEffect(() => {
    if (students.length > 0) {
      fetchFees();
    } else {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, students]);

  const fetchStudents = async () => {
    try {
      const response = await api.get("/students/?page_size=1000");
      // Filter active students if needed, though API currently returns all
      setStudents(response.data.results || response.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const fetchFees = async () => {
    try {
      setLoading(true);
      // Since our API endpoint returns all fees, we need to filter here.
      // Ideally backend would support query params like /fees/?month=X&year=Y
      const response = await api.get(`/fees/?page_size=1000`);
      const allFeesData = response.data.results || response.data;
      setAllFees(allFeesData);

      // Filter fees based on selected month/year and student admission date
      const filtered = allFeesData.filter((fee: any) => {
        const matchesMonth = fee.month === selectedMonth && fee.year === selectedYear;

        // Check if fee month is after student admission date
        const student = students.find(s => s.id === fee.student);
        if (student && student.admission_date) {
          const admissionDate = new Date(student.admission_date);
          const admissionYear = admissionDate.getFullYear();
          const admissionMonth = admissionDate.getMonth() + 1;

          // Fee should only show if it's for a month after admission
          const isFeeAfterAdmission = fee.year > admissionYear ||
            (fee.year === admissionYear && fee.month >= admissionMonth);

          return matchesMonth && isFeeAfterAdmission;
        }

        return matchesMonth;
      });

      // Create fee records for students who don't have one
      const existingStudentIds = new Set(filtered.map((f: any) => f.student));
      const missingFees = students
        .filter((s) => {
          if (existingStudentIds.has(s.id)) return false;
          // Check admission date
          if (!s.admission_date) return true;

          const admDate = new Date(s.admission_date);
          // Compare year and month
          if (selectedYear < admDate.getFullYear()) return false;
          if (selectedYear === admDate.getFullYear() && selectedMonth < (admDate.getMonth() + 1)) return false;

          return true;
        })
        .map((s) => ({
          student: s.id,
          month: selectedMonth,
          year: selectedYear,
          amount: s.fee_structure === '4_classes_1000' ? 1000 : 700,
          status: "unpaid",
          paid_date: null,
          partial_amount_paid: 0,
          payment_history: [],
        }));

      if (missingFees.length > 0 && isAdmin) {
        // Bulk insert not directly supported by our generic viewset efficiently without loop
        // or a custom endpoint. For now, we will loop (not ideal but works for small numbers)
        // or just rely on manual creation?
        // Let's loop for now as it's safe.
        for (const fee of missingFees) {
          await api.post("/fees/", fee);
        }
        fetchFees(); // Refresh
        return;
      }

      setFees(filtered || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load fees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePartialPayment = async () => {
    const amount = parseFloat(partialAmountInput);

    if (!selectedFeeForPartial || isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Get student and calculate total fee
    const student = students.find(s => s.id === selectedFeeForPartial.student);
    const totalFee = student?.fee_structure === '4_classes_1000' ? 1000 : 700;

    // Get current partial amount paid
    const currentPartialPaid = parseFloat(selectedFeeForPartial.partial_amount_paid || "0");
    const newTotal = currentPartialPaid + amount;

    // Validate not exceeding total
    if (newTotal > totalFee) {
      toast({
        title: "Amount Exceeds Total",
        description: `Total fee is ₹${totalFee}. Already paid ₹${currentPartialPaid}. Cannot add ₹${amount}.`,
        variant: "destructive",
      });
      return;
    }

    // Check if this payment completes the fee
    if (newTotal === totalFee) {
      // Auto-convert to paid
      await updateFeeStatus(selectedFeeForPartial.id, "paid");
      toast({
        title: "Payment Complete",
        description: `Fee fully paid (₹${totalFee})`,
      });
    } else {
      // Update partial amount
      await updateFeeStatus(selectedFeeForPartial.id, "partial", newTotal);
    }

    setPartialPaymentOpen(false);
    setPartialAmountInput("");
    setSelectedFeeForPartial(null);
  };

  const updateFeeStatus = async (feeId: number, status: string, partialAmount?: number) => {
    if (!isAdmin) return;

    try {
      // Get the fee to check its month/year and current status
      const fee = fees.find(f => f.id === feeId);
      if (!fee) return;

      // Prevent changing paid fees to unpaid or partial
      if (fee.status === 'paid' && (status === 'unpaid' || status === 'partial')) {
        toast({
          title: "Cannot Change Status",
          description: "Cannot change a paid fee to unpaid or partial. This fee has already been marked as paid.",
          variant: "destructive",
        });
        return;
      }

      // Prevent changing partial fees to unpaid
      if (fee.status === 'partial' && status === 'unpaid') {
        toast({
          title: "Cannot Change Status",
          description: "Cannot change a partial fee to unpaid. Partial payments have already been made.",
          variant: "destructive",
        });
        return;
      }

      // Prevent updating fees for future months/years
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      if (fee.year > currentYear || (fee.year === currentYear && fee.month > currentMonth)) {
        toast({
          title: "Cannot Update Future Fee",
          description: "You cannot update fees for future months.",
          variant: "destructive",
        });
        return;
      }

      const updateData: any = { status };

      if (status === "paid") {
        updateData.paid_date = new Date().toISOString().split("T")[0];

        // If changing from partial to paid, add remaining amount to payment history
        if (fee.status === "partial" && fee.partial_amount_paid) {
          const student = students.find(s => s.id === fee.student);
          const totalFee = student?.fee_structure === '4_classes_1000' ? 1000 : 700;
          const remainingAmount = totalFee - parseFloat(fee.partial_amount_paid.toString());

          if (remainingAmount > 0) {
            const currentHistory = fee.payment_history || [];
            const paymentEntry = {
              date: new Date().toISOString().split("T")[0],
              amount: remainingAmount
            };
            updateData.payment_history = [...currentHistory, paymentEntry];
          }
        }

        updateData.partial_amount_paid = 0;
      } else if (status === "unpaid") {
        updateData.paid_date = null;
        updateData.partial_amount_paid = 0;
        updateData.payment_history = [];
      } else if (status === "partial" && partialAmount) {
        updateData.partial_amount_paid = partialAmount;
        updateData.paid_date = new Date().toISOString().split("T")[0];

        // Add to payment history
        const currentHistory = fee.payment_history || [];
        const paymentEntry = {
          date: new Date().toISOString().split("T")[0],
          amount: partialAmount - (parseFloat(fee.partial_amount_paid || "0"))
        };
        updateData.payment_history = [...currentHistory, paymentEntry];
      }

      await api.patch(`/fees/${feeId}/`, updateData);

      toast({
        title: "Fee updated",
        description: `Fee status changed to ${status}`,
      });

      fetchFees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update fee",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = (feeId: number, value: string) => {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;

    if (value === 'partial') {
      setSelectedFeeForPartial(fee);
      setPartialAmountInput(fee.partial_amount_paid ? fee.partial_amount_paid.toString() : "");
      setPartialPaymentOpen(true);
    } else {
      const student = students.find(s => s.id === fee.student);
      const feeAmount = student?.fee_structure === '4_classes_1000' ? 1000 : 700;
      updateFeeStatus(fee.id, value, feeAmount);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-green-100 text-green-800 border-green-300",
      unpaid: "bg-red-100 text-red-800 border-red-300",
      partial: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
    return styles[status as keyof typeof styles] || styles.unpaid;
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Helper to safely get student
  const getStudent = (id: any) => students.find(s => s.id === id);

  const totalAmount = fees.reduce((sum, fee) => {
    const student = getStudent(fee.student);
    const amount = student?.fee_structure === '4_classes_1000' ? 1000 : 700;
    return sum + amount;
  }, 0);

  const paidAmount = fees.reduce((sum, fee) => {
    const student = getStudent(fee.student);
    const amount = student?.fee_structure === '4_classes_1000' ? 1000 : 700;

    if (fee.status === "paid") {
      return sum + amount;
    }
    if (fee.status === "partial") {
      return sum + Number(fee.partial_amount_paid || 0);
    }
    return sum;
  }, 0);

  const unpaidCount = fees.filter((f) => f.status === "unpaid").length;

  if (loading && fees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Monthly Fees</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track and manage student fee payments</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold text-green-600">₹{paidAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-red-600">₹{(totalAmount - paidAmount).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-40">
                <label className="text-sm font-medium mb-1 block">Year</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(val) => setSelectedYear(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-40">
                <label className="text-sm font-medium mb-1 block">Month</label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(val) => setSelectedMonth(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1)
                      .filter(month => {
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const currentMonth = currentDate.getMonth() + 1;

                        // If selected year is current year, only show months up to current month
                        if (selectedYear === currentYear) {
                          return month <= currentMonth;
                        }
                        // If selected year is in the past, show all months
                        return selectedYear < currentYear;
                      })
                      .map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(0, month - 1).toLocaleString("default", { month: "long" })}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-40">
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5" />
                      <SelectValue placeholder="Filter Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const currentDate = new Date();
                  setSelectedMonth(currentDate.getMonth() + 1);
                  setSelectedYear(currentDate.getFullYear());
                  setStatusFilter("all");
                  // Trigger re-fetch by updating state
                  setTimeout(() => {
                    fetchFees();
                    fetchStudents();
                  }, 100);
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <ExportFeesDialog
                  students={students}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Fee Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-8 p-0 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                >
                  <XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {fees.filter(fee => {
              // Status filter
              if (statusFilter !== "all" && fee.status !== statusFilter) return false;

              // Name search filter
              if (searchQuery) {
                const student = getStudent(fee.student);
                if (!student) return false;
                return student.name.toLowerCase().includes(searchQuery.toLowerCase());
              }

              return true;
            }).map((fee) => {
              const student = getStudent(fee.student);
              if (!student) return null;

              const feeAmount = student.fee_structure === '4_classes_1000' ? 1000 : 700;

              return (
                <div
                  key={fee.id}
                  className="flex flex-col gap-3 p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{student.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Total Amount: ₹{feeAmount.toFixed(2)}
                        {fee.paid_date && ` • Paid on ${new Date(fee.paid_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 items-center">
                        {/* Payment History Button - FIRST */}
                        {fee.payment_history && Array.isArray(fee.payment_history) && fee.payment_history.length > 0 &&
                          (() => {
                            const totalPaid = fee.payment_history.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);
                            return (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-10 w-10 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                    title="Payment History"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Payment History</h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                      {fee.payment_history.map((payment: any, index: number) => (
                                        <div key={index} className="flex justify-between text-sm border-b pb-2">
                                          <span className="text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</span>
                                          <span className="font-medium">₹{parseFloat(payment.amount).toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="pt-2 border-t">
                                      <div className="flex justify-between font-semibold">
                                        <span>Total Paid:</span>
                                        <span className="text-green-600">₹{totalPaid.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          })()}

                        {/* Invoice Button - SECOND */}
                        {(fee.status === 'paid' || fee.status === 'partial') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-10 w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedStudentForInvoice(student);
                              setInvoiceDefaultMonth(fee.month);
                              setInvoiceDefaultYear(fee.year);
                              setInvoiceDialogOpen(true);
                            }}
                            title="Generate Invoice"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Status Dropdown - THIRD */}
                        <Select value={fee.status} onValueChange={(value) => handleStatusChange(fee.id, value)}>
                          <SelectTrigger className={`w-32 h-10 ${fee.status === 'paid' ? 'bg-green-50 text-green-700 border-green-300' :
                              fee.status === 'partial' ? 'bg-yellow-50 text-orange-700 border-yellow-300' :
                                'bg-red-50 text-red-700 border-red-300'
                            }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid" className="bg-green-50">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-700 font-medium">Paid</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="partial" className="bg-yellow-50">
                              <div className="flex items-center gap-2">
                                <IndianRupee className="h-4 w-4 text-orange-600" />
                                <span className="text-orange-700 font-medium">Partial</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="unpaid" className="bg-red-50">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-red-700 font-medium">Unpaid</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  {fee.status === 'partial' && (
                    <div className="flex gap-4 mt-2 text-sm items-center">
                      <p className="text-muted-foreground">
                        Paid: <span className="font-semibold text-green-600">₹{fee.partial_amount_paid || 0}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Remaining: <span className="font-semibold text-red-600">₹{feeAmount - (fee.partial_amount_paid || 0)}</span>
                      </p>
                      {isAdmin && (
                        <div className="ml-auto flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedFeeForPartial(fee);
                              setPartialAmountInput("");
                              setPartialPaymentOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={partialPaymentOpen} onOpenChange={setPartialPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Partial Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFeeForPartial && (() => {
              const student = students.find(s => s.id === selectedFeeForPartial.student);
              const totalFee = student?.fee_structure === '4_classes_1000' ? 1000 : 700;
              const currentPaid = parseFloat(selectedFeeForPartial.partial_amount_paid || "0");
              const remaining = totalFee - currentPaid;

              return (
                <>
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Fee:</span>
                      <span className="font-semibold">₹{totalFee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Already Paid:</span>
                      <span className="font-semibold text-green-600">₹{currentPaid}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className="font-bold text-red-600">₹{remaining}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Add Payment Amount</Label>
                    <Input
                      type="number"
                      placeholder={`Enter amount (max ₹${remaining})`}
                      value={partialAmountInput}
                      onChange={(e) => setPartialAmountInput(e.target.value)}
                    />
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartialPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handlePartialPayment}>Add Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GenerateInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        student={selectedStudentForInvoice}
        fees={selectedStudentForInvoice ? allFees.filter((f) => f.student === selectedStudentForInvoice.id) : []}
        defaultMonth={invoiceDefaultMonth}
        defaultYear={invoiceDefaultYear}
      />
    </div>
  );
};

export default Fees;
