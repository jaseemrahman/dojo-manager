import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const generateInvoice = async (fees: any[], student: any, year: number) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Helper to load image
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
        let yPos = 15;

        // 1. Logo (centered)
        try {
            const logoBase64 = await loadImage("/images/mta-logo.jpeg");
            const imgWidth = 25;
            const imgHeight = 25;
            const x = (pageWidth - imgWidth) / 2;
            doc.addImage(logoBase64, "JPEG", x, yPos, imgWidth, imgHeight);
            yPos += 30;
        } catch (e) {
            console.error("Logo load failed", e);
            yPos += 5;
        }

        // 2. Header Text
        doc.setFontSize(16);
        doc.setTextColor(139, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Master's Taekwon-Do Academy", pageWidth / 2, yPos, { align: "center" });
        yPos += 8;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("FEE INVOICE", pageWidth / 2, yPos, { align: "center" });
        yPos += 5;

        // Separator Line
        doc.setDrawColor(139, 0, 0);
        doc.setLineWidth(0.8);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 10;

        // 3. Invoice Details
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const leftX = 15;
        const rightX = 120;

        // Invoice No
        doc.setFont("helvetica", "bold");
        doc.text("Invoice No:", leftX, yPos);
        doc.setFont("helvetica", "normal");
        const firstMonth = fees[0].month;
        const lastMonth = fees[fees.length - 1].month;
        const invId = `INV-${year}${firstMonth.toString().padStart(2, '0')}${lastMonth.toString().padStart(2, '0')}-${year}${lastMonth.toString().padStart(2, '0')}${fees[0].id || student.id}`;
        doc.text(invId, leftX + 30, yPos);

        // Date
        doc.setFont("helvetica", "bold");
        doc.text("Date:", rightX, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(format(new Date(), "dd/MM/yyyy"), rightX + 20, yPos);
        yPos += 7;

        // Period
        doc.setFont("helvetica", "bold");
        doc.text("Period:", leftX, yPos);
        doc.setFont("helvetica", "normal");
        const periodStr = fees.length === 1
            ? format(new Date(year, firstMonth - 1), "MMMM yyyy")
            : `${format(new Date(year, firstMonth - 1), "MMMM yyyy")} - ${format(new Date(year, lastMonth - 1), "MMMM yyyy")}`;
        doc.text(periodStr, leftX + 30, yPos);

        // Status
        const allPaid = fees.every(f => f.status === 'paid');
        const allUnpaid = fees.every(f => f.status === 'unpaid');
        const overallStatus = allPaid ? 'Paid' : allUnpaid ? 'Unpaid' : 'Partial';

        doc.setFont("helvetica", "bold");
        doc.text("Status:", rightX, yPos);
        doc.setFont("helvetica", "normal");

        if (overallStatus === 'Paid') doc.setTextColor(0, 128, 0);
        else if (overallStatus === 'Partial') doc.setTextColor(255, 165, 0);
        else doc.setTextColor(255, 0, 0);

        doc.text(overallStatus, rightX + 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 12;

        // 4. Bill To Section
        const billToHeight = 35;
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos, pageWidth - 30, billToHeight, 'F');

        yPos += 7;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("BILL TO:", 20, yPos);
        yPos += 7;

        doc.setFontSize(9);
        // Student Name
        doc.setFont("helvetica", "bold");
        doc.text("Student Name:", 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(student.name.toUpperCase(), 55, yPos);

        // Phone
        doc.setFont("helvetica", "bold");
        doc.text("Phone:", 120, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(student.phone_number || "-", 145, yPos);
        yPos += 6;

        // Guardian
        doc.setFont("helvetica", "bold");
        doc.text("Guardian:", 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(student.guardian_name || "-", 55, yPos);
        yPos += 6;

        // Address
        doc.setFont("helvetica", "bold");
        doc.text("Address:", 20, yPos);
        doc.setFont("helvetica", "normal");
        const addressText = student.address || "-";
        doc.text(addressText.substring(0, 50), 55, yPos);
        yPos += 12;

        // 5. Fee Table
        const tableBody = fees.map(fee => {
            const feeDate = new Date(year, fee.month - 1);
            const feeMonthStr = format(feeDate, "MMMM yyyy");
            let paid = 0;
            if (fee.status === 'paid') paid = parseFloat(fee.amount || "0");
            else if (fee.status === 'partial') paid = parseFloat(fee.partial_amount_paid || "0");
            const amount = fee.amount ? parseFloat(fee.amount) : (student.fee_structure === '4_classes_1000' ? 1000 : 700);
            const balance = amount - paid;
            const statusDisplay = fee.status ? fee.status.charAt(0).toUpperCase() + fee.status.slice(1) : 'Unpaid';
            const feeType = student.fee_structure === '4_classes_1000' ? '4 classes/week' : '2 classes/week';

            return [
                feeMonthStr,
                feeType,
                `Rs.${amount.toFixed(2)}`,
                `Rs.${paid.toFixed(2)}`,
                `Rs.${balance.toFixed(2)}`,
                statusDisplay
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [["Month", "Fee Type", "Amount", "Paid", "Balance", "Status"]],
            body: tableBody,
            headStyles: {
                fillColor: [139, 0, 0],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10,
                halign: 'center',
                cellPadding: 4
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 3
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'left' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'center' }
            },
            styles: {
                lineColor: [255, 255, 255],
                lineWidth: 0
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 5) {
                    const status = data.cell.raw;
                    if (status === 'Paid') data.cell.styles.textColor = [0, 128, 0];
                    else if (status === 'Partial') data.cell.styles.textColor = [255, 165, 0];
                    else data.cell.styles.textColor = [255, 0, 0];
                }
            },
            theme: 'plain',
            tableWidth: 'auto',
            margin: { left: 15, right: 15 }
        });

        // 6. Summary
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        const summaryLabelX = 120;
        const summaryValueX = pageWidth - 15;

        doc.setFontSize(10);

        // Calculate totals
        const totalAmount = fees.reduce((sum, f) => {
            const amt = f.amount ? parseFloat(f.amount) : (student.fee_structure === '4_classes_1000' ? 1000 : 700);
            return sum + amt;
        }, 0);

        const totalPaidVal = fees.reduce((sum, f) => {
            if (f.status === 'paid') return sum + parseFloat(f.amount || "0");
            if (f.status === 'partial') return sum + parseFloat(f.partial_amount_paid || "0");
            return sum;
        }, 0);

        const totalBalance = totalAmount - totalPaidVal;

        // Total Amount
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Total Amount:", summaryLabelX, finalY);
        doc.setFont("helvetica", "normal");
        doc.text(`Rs.${totalAmount.toFixed(2)}`, summaryValueX, finalY, { align: "right" });

        // Total Paid
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 128, 0);
        doc.text("Total Paid:", summaryLabelX, finalY + 6);
        doc.setFont("helvetica", "normal");
        doc.text(`Rs.${totalPaidVal.toFixed(2)}`, summaryValueX, finalY + 6, { align: "right" });

        // Balance Due
        doc.setFont("helvetica", "bold");
        doc.setTextColor(139, 0, 0);
        doc.text("Balance Due:", summaryLabelX, finalY + 12);

        // Underline
        doc.setLineWidth(0.5);
        doc.setDrawColor(139, 0, 0);
        doc.line(summaryLabelX, finalY + 14, summaryValueX, finalY + 14);

        doc.setFontSize(11);
        doc.text(`Rs.${totalBalance.toFixed(2)}`, summaryValueX, finalY + 20, { align: "right" });

        // 7. Footer
        const footerY = 270;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you for being a part of Master's Taekwon-Do Academy!", pageWidth / 2, footerY, { align: "center" });
        doc.text("This is a computer-generated invoice.", pageWidth / 2, footerY + 4, { align: "center" });

        doc.save(`Invoice_${student.name}_${periodStr.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error("Error generating invoice:", error);
        alert("Failed to generate invoice");
    }
};
