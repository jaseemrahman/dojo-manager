import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function ExportBeltTestDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
    const [status, setStatus] = useState<string>("passed");
    const { toast } = useToast();

    const resetForm = () => {
        setFromDate(new Date().toISOString().split("T")[0]);
        setToDate(new Date().toISOString().split("T")[0]);
        setStatus("passed");
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            resetForm();
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (fromDate) params.append("start_date", fromDate);
            if (toDate) params.append("end_date", toDate);
            params.append("status", status);

            const response = await api.get(`/belt-tests/export_excel/?${params.toString()}`, {
                responseType: 'blob',
            });

            // Extract filename from Content-Disposition header
            // Try both lowercase and original case as axios may normalize headers
            const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
            let filename = `TAI GRADING CERTIFICATE LIST(${format(new Date(), "dd-MM-yyyy")}).xlsx`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setOpen(false);
            resetForm();
            toast({
                title: "Export Successful",
                description: "The excel file has been downloaded.",
            });
        } catch (error: any) {
            let errorTitle = "Export Failed";
            let errorMessage = "There was an error generating the excel file.";

            // Check if it's a validation error (no data)
            // When responseType is 'blob', error.response.data might be a Blob
            if (error.response?.status === 400) {
                try {
                    // If the error response is a blob, we need to parse it
                    if (error.response.data instanceof Blob) {
                        const text = await error.response.data.text();
                        const jsonData = JSON.parse(text);
                        if (jsonData.error) {
                            errorTitle = "No Data Found";
                            errorMessage = jsonData.error;
                        }
                    } else if (error.response.data?.error) {
                        errorTitle = "No Data Found";
                        errorMessage = error.response.data.error;
                    }
                } catch (parseError) {
                    // If parsing fails, use default error message
                }
            }

            toast({
                title: errorTitle,
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                    <Download className="h-4 w-4" />
                    Export Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Belt Tests</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fromDate">From Date</Label>
                            <Input
                                id="fromDate"
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="toDate">To Date</Label>
                            <Input
                                id="toDate"
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="passed">Passed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleExport} disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Download Excel
                </Button>
            </DialogContent>
        </Dialog>
    );
}
