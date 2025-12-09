import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { generateInvoice } from "./FeeInvoice"; // We will update this function
import { X } from "lucide-react";

interface GenerateInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: any;
    fees: any[]; // All fees for this student
    defaultMonth?: number;
    defaultYear?: number;
}

export function GenerateInvoiceDialog({
    open,
    onOpenChange,
    student,
    fees,
    defaultMonth,
    defaultYear,
}: GenerateInvoiceDialogProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

    // Reset when dialog opens or student changes
    useEffect(() => {
        if (open) {
            if (defaultYear) setSelectedYear(defaultYear);
            else setSelectedYear(currentYear);

            if (defaultMonth) setSelectedMonths([defaultMonth]);
            else setSelectedMonths([]);
        }
    }, [open, student, defaultYear, defaultMonth]);

    const months = [
        { value: 1, label: "Jan" },
        { value: 2, label: "Feb" },
        { value: 3, label: "Mar" },
        { value: 4, label: "Apr" },
        { value: 5, label: "May" },
        { value: 6, label: "Jun" },
        { value: 7, label: "Jul" },
        { value: 8, label: "Aug" },
        { value: 9, label: "Sep" },
        { value: 10, label: "Oct" },
        { value: 11, label: "Nov" },
        { value: 12, label: "Dec" },
    ];

    const handleMonthToggle = (month: number) => {
        setSelectedMonths((prev) =>
            prev.includes(month)
                ? prev.filter((m) => m !== month)
                : [...prev, month].sort((a, b) => a - b)
        );
    };

    const handleGenerate = async () => {
        // Gather fee data for selected months
        // If fee record exists, use it. If not, create a dummy one (unpaid).
        const selectedFees = selectedMonths.map((month) => {
            const existingFee = fees.find((f) => f.month === month && f.year === selectedYear);
            if (existingFee) return existingFee;

            return {
                month,
                year: selectedYear,
                amount: student.fee_structure === '4_classes_1000' ? 1000 : 700,
                status: 'unpaid',
                partial_amount_paid: 0,
                student: student.id, // Just for reference
            };
        });

        await generateInvoice(selectedFees, student, selectedYear);
        onOpenChange(false);
    };

    if (!student) return null;

    // Validation: Admission Date
    const admissionDate = student.admission_date ? new Date(student.admission_date) : null;

    const isMonthDisabled = (month: number) => {
        if (!admissionDate) return false;
        const admYear = admissionDate.getFullYear();
        const admMonth = admissionDate.getMonth() + 1;

        if (selectedYear < admYear) return true;
        if (selectedYear === admYear && month < admMonth) return true;

        // Additional Check: Is there a PAID or PARTIAL fee for this month?
        // User requested "only months that student is paid or partial"
        const fee = fees.find((f) => f.month === month && f.year === selectedYear);
        if (!fee) return true; // No record -> cannot invoice
        if (fee.status !== 'paid' && fee.status !== 'partial') return true; // Unpaid -> cannot invoice

        return false;
    };

    // Calculate stats
    const totalAmount = selectedMonths.reduce((sum, month) => {
        const fee = fees.find((f) => f.month === month && f.year === selectedYear);
        const amount = fee ? parseFloat(fee.amount || "0") : (student.fee_structure === '4_classes_1000' ? 1000 : 700);
        return sum + amount;
    }, 0);

    const totalPaid = selectedMonths.reduce((sum, month) => {
        const fee = fees.find((f) => f.month === month && f.year === selectedYear);
        if (!fee) return sum;
        if (fee.status === 'paid') return sum + parseFloat(fee.amount || "0");
        if (fee.status === 'partial') return sum + parseFloat(fee.partial_amount_paid || "0");
        return sum;
    }, 0);

    const balanceDue = totalAmount - totalPaid;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate Invoice</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Select months to include in the invoice for <span className="font-semibold text-foreground">{student.name}</span>
                    </p>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Year Select */}
                    <div className="flex bg-muted/50 p-2 rounded-lg">
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(val) => {
                                setSelectedYear(parseInt(val));
                                setSelectedMonths([]); // Clear months on year change to avoid invalid/confusing states
                            }}
                        >
                            <SelectTrigger className="w-full bg-background border-none shadow-sm h-9">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {(() => {
                                    const admissionYear = student?.admission_date ? new Date(student.admission_date).getFullYear() : currentYear;
                                    const startYear = Math.min(admissionYear, currentYear); // Fail-safe
                                    // Generate years from startYear to currentYear
                                    const years = [];
                                    for (let y = startYear; y <= currentYear; y++) {
                                        years.push(y);
                                    }
                                    return years.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ));
                                })()}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Select Months</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {months.map((m) => {
                                const disabled = isMonthDisabled(m.value);
                                const isSelected = selectedMonths.includes(m.value);
                                const isDec = m.value === 12; // Just for styling demo if needed

                                return (
                                    <button
                                        key={m.value}
                                        onClick={() => !disabled && handleMonthToggle(m.value)}
                                        disabled={disabled}
                                        className={`
                      text-xs font-medium py-2 rounded-md border transition-all
                      ${disabled ? 'opacity-30 cursor-not-allowed bg-muted text-muted-foreground border-transparent' : ''}
                      ${!disabled && isSelected
                                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                                : !disabled && !isSelected
                                                    ? 'bg-background hover:bg-accent text-foreground border-input'
                                                    : ''
                                            }
                    `}
                                    >
                                        {isSelected && <span className="mr-1">✓</span>}
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Chips */}
                    {selectedMonths.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            <span className="text-xs text-muted-foreground mr-1 self-center">Selected:</span>
                            {selectedMonths.map(m => (
                                <span key={m} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground animate-in fade-in zoom-in duration-200">
                                    {months[m - 1].label} {selectedYear}
                                    <button onClick={() => handleMonthToggle(m)} className="ml-1 hover:text-red-500"><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Summary Card */}
                    <div className="bg-muted/30 border rounded-lg p-4 space-y-2 text-sm">
                        <h4 className="font-semibold text-foreground mb-3">Invoice Summary</h4>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Months Selected:</span>
                            <span className="font-medium">{selectedMonths.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Paid:</span>
                            <span className="font-medium text-green-600">₹{totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between items-center">
                            <span className="font-semibold text-muted-foreground">Balance Due:</span>
                            <span className="text-lg font-bold text-red-600">₹{balanceDue.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        onClick={handleGenerate}
                        disabled={selectedMonths.length === 0}
                    >
                        <Download className="h-4 w-4" /> {/* Wait, need to import Download */}
                        Download Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Need to import Download icon
import { Download } from "lucide-react";
