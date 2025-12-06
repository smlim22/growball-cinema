import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { CartItem } from '@/app/types/pos';

// Generate QR code as data URL
async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

// Format date to DD/MM/YYYY
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format time to HH:MM
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Generate F&B Receipt PDF
export async function generateReceiptPDF(
  orderNumber: string,
  items: CartItem[],
  total: number,
  paymentMethod: 'cash' | 'card',
  referenceNumber?: number
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GROWBALL CINEMAX', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('F&B Receipt', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Order Number
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Order No: ${orderNumber}`, margin, yPos);
  yPos += 8;

  // Date and Time
  const now = new Date();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(now)}`, margin, yPos);
  doc.text(`Time: ${formatTime(now)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Items (only F&B items)
  const fnbItems = items.filter(item => item.type === 'fnb');
  
  if (fnbItems.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Items:', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    fnbItems.forEach((item, index) => {
      // Check if we need a new page
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = margin;
      }

      const itemName = item.name;
      const quantity = item.quantity;
      const unitPrice = item.unitPrice || item.price / item.quantity;
      const itemTotal = item.price;

      // Item name and quantity
      doc.setFont('helvetica', 'bold');
      doc.text(`${itemName}`, margin, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.text(`  Qty: ${quantity} x RM ${unitPrice.toFixed(2)} = RM ${itemTotal.toFixed(2)}`, margin + 5, yPos);
      yPos += 8;
    });

    yPos += 5;
  }

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: RM ${total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

  // Payment Method
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${paymentMethod.toUpperCase()}`, margin, yPos);
  yPos += 6;

  if (paymentMethod === 'card' && referenceNumber) {
    doc.text(`Reference No: ${referenceNumber.toString()}`, margin, yPos);
    yPos += 6;
  }

  yPos += 10;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your purchase!', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // Save PDF
  doc.save(`Receipt_${orderNumber}.pdf`);
}

// Generate Ticket PDF with QR Code
export async function generateTicketPDF(
  ticketId: number,
  item: CartItem,
  orderNumber: string
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GROWBALL CINEMAX', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(16);
  doc.text('MOVIE TICKET', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Ticket ID
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ticket ID: #${ticketId}`, margin, yPos);
  yPos += 8;

  // Movie Name
  doc.setFontSize(14);
  doc.text(item.name || 'Movie', margin, yPos);
  yPos += 10;

  // Showtime Details
  if (item.showtime) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Format date
    const showDate = new Date(item.showtime.date);
    const formattedDate = formatDate(showDate);
    
    // Format time
    const [hours, minutes] = item.showtime.time.split(':');
    const timeDate = new Date();
    timeDate.setHours(parseInt(hours), parseInt(minutes));
    const formattedTime = timeDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    doc.text(`Date: ${formattedDate}`, margin, yPos);
    yPos += 6;
    doc.text(`Time: ${formattedTime}`, margin, yPos);
    yPos += 6;
  }

  // Seats
  if (item.seats && item.seats.length > 0) {
    doc.text(`Seats: ${item.seats.join(', ')}`, margin, yPos);
    yPos += 6;
  }

  // Ticket Breakdown
  if (item.ticketBreakdown) {
    yPos += 3;
    doc.setFont('helvetica', 'normal');
    if (item.ticketBreakdown.adult > 0) {
      doc.text(`Adult: ${item.ticketBreakdown.adult}`, margin, yPos);
      yPos += 5;
    }
    if (item.ticketBreakdown.senior > 0) {
      doc.text(`Senior: ${item.ticketBreakdown.senior}`, margin, yPos);
      yPos += 5;
    }
    if (item.ticketBreakdown.child > 0) {
      doc.text(`Child: ${item.ticketBreakdown.child}`, margin, yPos);
      yPos += 5;
    }
  }

  yPos += 5;

  // Price
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: RM ${item.price.toFixed(2)}`, margin, yPos);
  yPos += 10;

  // Order Number
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order No: ${orderNumber}`, margin, yPos);
  yPos += 10;

  // QR Code
  // Generate QR code data (ticket ID + order number + showtime ID)
  const qrData = JSON.stringify({
    ticketId,
    orderNumber,
    showtimeId: item.showtimeId,
    movieName: item.name,
    seats: item.seats,
  });

  try {
    const qrDataURL = await generateQRCodeDataURL(qrData);
    if (qrDataURL) {
      const qrSize = 60;
      const qrX = pageWidth - margin - qrSize;
      const qrY = yPos;
      doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
    }
  } catch (err) {
    console.error('Error adding QR code to PDF:', err);
  }

  yPos += 70;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Please present this ticket at the entrance hall.', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text('Thank you for choosing Growball Cinemax!', pageWidth / 2, yPos, { align: 'center' });

  // Save PDF
  doc.save(`Ticket_${ticketId}.pdf`);
}

// Interface for ticket sales summary data
export interface TicketSalesSummaryData {
  date: string;
  count: number;
  revenue: number;
  details: {
    movieName: string;
    showtime: string;
    date: string;
    tickets: number;
    revenue: number;
  }[];
}

// Interface for table row data
export interface TicketSalesTableRow {
  date: string;
  movieName: string;
  tickets: number;
  revenue: number;
}

// Generate Ticket Sales Summary PDF
export async function generateTicketSalesSummaryPDF(
  startDate: string,
  endDate: string,
  salesData: TicketSalesSummaryData[]
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GROWBALL CINEMAX', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(16);
  doc.text('TICKET SALES SUMMARY', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Date Range
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const startDateFormatted = formatDate(new Date(startDate));
  const endDateFormatted = formatDate(new Date(endDate));
  doc.text(`Period: ${startDateFormatted} to ${endDateFormatted}`, margin, yPos);
  yPos += 8;

  // Generated Date and Time
  const now = new Date();
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(now)} at ${formatTime(now)}`, margin, yPos);
  yPos += 15;

  // Flatten data into table rows
  const tableRows: TicketSalesTableRow[] = [];
  salesData.forEach((dayData) => {
    if (dayData.details && dayData.details.length > 0) {
      dayData.details.forEach((detail) => {
        tableRows.push({
          date: detail.date,
          movieName: detail.movieName,
          tickets: detail.tickets,
          revenue: detail.revenue
        });
      });
    }
  });

  // Sort by date
  tableRows.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate total revenue
  const totalRevenue = tableRows.reduce((sum, row) => sum + row.revenue, 0);

  // Table setup
  const tableStartY = yPos;
  const rowHeight = 8;

  // Adjusted column widths for better fitting
  const colWidths = {
    date: 30,
    movieName: 95,
    tickets: 25,
    revenue: 30
  };

  const tableStartX = margin;
  const ticketsX = pageWidth - margin - colWidths.revenue - colWidths.tickets;
  const revenueX = pageWidth - margin;

  // Table header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  yPos += 5;

  // Header top border
  doc.setLineWidth(0.25);
  doc.line(tableStartX, yPos - 4, pageWidth - margin, yPos - 4);

  yPos += 2;
  // Header labels
  doc.text('Date', tableStartX, yPos);
  doc.text('Movie Name', tableStartX + colWidths.date, yPos);
  doc.text('No. Of Ticket Sold', ticketsX, yPos, { align: 'center' });
  doc.text('Revenue (RM)', revenueX, yPos, { align: 'right' });

  yPos += 3;
  // Header bottom border
  doc.line(tableStartX, yPos, pageWidth - margin, yPos);
  yPos += 7;

  // Table rows
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  tableRows.forEach((row) => {
    // Page break check
    if (yPos > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPos = margin + 5;

      // Redraw header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.line(tableStartX, yPos - 4, pageWidth - margin, yPos - 4);
      yPos += 2;
      doc.text('Date', tableStartX, yPos);
      doc.text('Movie Name', tableStartX + colWidths.date, yPos);
      doc.text('No. Of Ticket Sold', ticketsX, yPos, { align: 'center' });
      doc.text('Revenue (RM)', revenueX, yPos, { align: 'right' });
      yPos += 3;
      doc.line(tableStartX, yPos, pageWidth - margin, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }

    const dateFormatted = formatDate(new Date(row.date));
    doc.text(dateFormatted, tableStartX, yPos);

    // Movie name truncation
    let movieName = row.movieName;
    const maxMovieNameWidth = colWidths.movieName - 4;
    if (doc.getTextWidth(movieName) > maxMovieNameWidth) {
      while (doc.getTextWidth(movieName + '...') > maxMovieNameWidth && movieName.length > 0) {
        movieName = movieName.slice(0, -1);
      }
      movieName += '...';
    }
    doc.text(movieName, tableStartX + colWidths.date, yPos);

    // Numeric values aligned with headers
    doc.text(row.tickets.toString(), ticketsX, yPos, { align: 'center' });
    doc.text(row.revenue.toFixed(2), revenueX, yPos, { align: 'right' });

    yPos += rowHeight;
  });

  // Bottom table border
  doc.setLineWidth(0.25);
  doc.line(tableStartX, yPos, pageWidth - margin, yPos);
  yPos += 7;

  // Total Revenue Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Revenue (RM): ${totalRevenue.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  doc.line(tableStartX, yPos, pageWidth - margin, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is an automated report generated by Growball Cinemax Management System.', 
    pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // Save PDF
  const filename = `Ticket_Sales_Summary_${startDate}_to_${endDate}.pdf`;
  doc.save(filename);
}

// Interface for FNB sales table row data
export interface FNBSalesTableRow {
  date: string;
  itemName: string;
  quantity: number;
  revenue: number;
}

// Generate FNB Sales Summary PDF
export async function generateFNBSalesSummaryPDF(
  startDate: string,
  endDate: string,
  salesData: FNBSalesTableRow[]
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GROWBALL CINEMAX', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(16);
  doc.text('FNB SALES SUMMARY', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Date Range
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const startDateFormatted = formatDate(new Date(startDate));
  const endDateFormatted = formatDate(new Date(endDate));
  doc.text(`Period: ${startDateFormatted} to ${endDateFormatted}`, margin, yPos);
  yPos += 8;

  // Generated Date and Time
  const now = new Date();
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(now)} at ${formatTime(now)}`, margin, yPos);
  yPos += 15;

  // Sort by date
  salesData.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate total revenue
  const totalRevenue = salesData.reduce((sum, row) => sum + row.revenue, 0);

  // Table setup
  const tableStartY = yPos;
  const rowHeight = 8;

  // Adjusted column widths for better fitting
  const colWidths = {
    date: 30,
    itemName: 95,
    quantity: 25,
    revenue: 30
  };

  const tableStartX = margin;
  const quantityX = pageWidth - margin - colWidths.revenue - colWidths.quantity;
  const revenueX = pageWidth - margin;

  // Table header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  yPos += 5;

  // Header top border
  doc.setLineWidth(0.25);
  doc.line(tableStartX, yPos - 4, pageWidth - margin, yPos - 4);

  yPos += 2;
  // Header labels
  doc.text('Date', tableStartX, yPos);
  doc.text('Item Name', tableStartX + colWidths.date, yPos);
  doc.text('Quantity', quantityX, yPos, { align: 'center' });
  doc.text('Revenue (RM)', revenueX, yPos, { align: 'right' });

  yPos += 3;
  // Header bottom border
  doc.line(tableStartX, yPos, pageWidth - margin, yPos);
  yPos += 7;

  // Table rows
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  salesData.forEach((row) => {
    // Page break check
    if (yPos > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPos = margin + 5;

      // Redraw header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.line(tableStartX, yPos - 4, pageWidth - margin, yPos - 4);
      yPos += 2;
      doc.text('Date', tableStartX, yPos);
      doc.text('Item Name', tableStartX + colWidths.date, yPos);
      doc.text('Quantity', quantityX, yPos, { align: 'center' });
      doc.text('Revenue (RM)', revenueX, yPos, { align: 'right' });
      yPos += 3;
      doc.line(tableStartX, yPos, pageWidth - margin, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }

    const dateFormatted = formatDate(new Date(row.date));
    doc.text(dateFormatted, tableStartX, yPos);

    // Item name truncation - calculate based on actual available space
    let itemName = row.itemName;
    const itemNameStartX = tableStartX + colWidths.date;
    const padding = 4; // Padding between item name and quantity column
    const maxItemNameWidth = quantityX - itemNameStartX - padding;
    
    if (doc.getTextWidth(itemName) > maxItemNameWidth) {
      while (doc.getTextWidth(itemName + '...') > maxItemNameWidth && itemName.length > 0) {
        itemName = itemName.slice(0, -1);
      }
      itemName += '...';
    }
    doc.text(itemName, itemNameStartX, yPos);

    // Numeric values aligned with headers
    doc.text(row.quantity.toString(), quantityX, yPos, { align: 'center' });
    doc.text(row.revenue.toFixed(2), revenueX, yPos, { align: 'right' });

    yPos += rowHeight;
  });

  // Bottom table border
  doc.setLineWidth(0.25);
  doc.line(tableStartX, yPos, pageWidth - margin, yPos);
  yPos += 7;

  // Total Revenue Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Revenue (RM): ${totalRevenue.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  doc.line(tableStartX, yPos, pageWidth - margin, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is an automated report generated by Growball Cinemax Management System.', 
    pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // Save PDF
  const filename = `FNB_Sales_Summary_${startDate}_to_${endDate}.pdf`;
  doc.save(filename);
}
