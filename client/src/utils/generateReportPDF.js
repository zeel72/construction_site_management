import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a Khatabook-style Financial PDF Report
 * 
 * @param {Object} reportData - The data object containing `summary` and `parties` array
 * @param {String} siteName - The name of the construction site
 */
export const generateFinancialReportPDF = (reportData, siteName) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const { summary, parties } = reportData;

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || amount === 0) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ============================================
  // 1. Header (Title & Subtitle)
  // ============================================
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(`${siteName} - Financial Report`, pageWidth / 2, 40, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`(As of Today - ${formatDate(new Date())})`, pageWidth / 2, 55, { align: 'center' });

  // ============================================
  // 2. Summary Boxes
  // ============================================
  const boxY = 70;
  const boxHeight = 60;
  const margin = 40;
  const boxWidth = pageWidth - margin * 2;
  const colWidth = boxWidth / 3;

  // Draw main border box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, boxY, boxWidth, boxHeight, 3, 3, 'FD');

  // Draw separator lines
  doc.line(margin + colWidth, boxY + 10, margin + colWidth, boxY + boxHeight - 10);
  doc.line(margin + colWidth * 2, boxY + 10, margin + colWidth * 2, boxY + boxHeight - 10);

  // Box 1: You'll Get (Advances)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("You'll Get", margin + colWidth / 2, boxY + 25, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30); // Dark text
  doc.text(formatCurrency(summary.totalYouWillGet), margin + colWidth / 2, boxY + 45, { align: 'center' });

  // Box 2: You'll Give (Payables)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("You'll Give", margin + colWidth + colWidth / 2, boxY + 25, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(formatCurrency(summary.totalYouWillGive), margin + colWidth + colWidth / 2, boxY + 45, { align: 'center' });

  // Box 3: Net Balance
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Net Balance", margin + colWidth * 2 + colWidth / 2, boxY + 25, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  
  let netText = formatCurrency(Math.abs(summary.netBalance));
  if (summary.netBalance > 0) {
    doc.setTextColor(220, 53, 69); // Red (We owe)
    netText += " Dr";
  } else if (summary.netBalance < 0) {
    doc.setTextColor(40, 167, 69); // Green (They owe us)
    netText += " Cr";
  } else {
    doc.setTextColor(30, 30, 30);
  }
  doc.text(netText, margin + colWidth * 2 + colWidth / 2, boxY + 45, { align: 'center' });

  // Count text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`No. of Parties: ${parties.length} (All)`, margin, boxY + boxHeight + 20);

  // ============================================
  // 3. Data Table
  // ============================================
  
  const tableData = parties.map(p => {
    let youWillGet = '-';
    let youWillGive = '-';

    if (p.balance > 0) {
      youWillGive = formatCurrency(p.balance);
    } else if (p.balance < 0) {
      youWillGet = formatCurrency(Math.abs(p.balance));
    }

    return [
      p.name,
      p.type,
      youWillGet,
      youWillGive,
      formatDate(p.lastActivityDate)
    ];
  });

  autoTable(doc, {
    startY: boxY + boxHeight + 30,
    head: [['Name', 'Details', "You'll Get", "You'll Give", 'Last Activity']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [248, 249, 250],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
      halign: 'left'
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
      fontSize: 9
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right', fillColor: [240, 248, 240] }, // Light Green background for "You'll Get"
      3: { halign: 'right', fillColor: [253, 240, 240] }, // Light Red background for "You'll Give"
      4: { halign: 'center' }
    },
    styles: {
      cellPadding: 6
    },
    // Customize text colors for specific cells based on content
    didParseCell: function (data) {
      // You'll Get Column
      if (data.section === 'body' && data.column.index === 2 && data.cell.raw !== '-') {
        data.cell.styles.textColor = [40, 167, 69]; // Green text
      }
      // You'll Give Column
      if (data.section === 'body' && data.column.index === 3 && data.cell.raw !== '-') {
        data.cell.styles.textColor = [220, 53, 69]; // Red text
      }
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255] // Force white so our column background colors stand out
    },
    margin: { top: margin, right: margin, bottom: margin, left: margin },
  });

  // Footer with Page Numbers
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'right' }
    );
  }

  // Generate Filename
  const fileName = `${siteName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_financial_report_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Trigger download
  doc.save(fileName);
};
