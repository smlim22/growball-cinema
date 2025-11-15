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
  doc.text('Please present this ticket at the cinema.', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text('Thank you for choosing Growball Cinemax!', pageWidth / 2, yPos, { align: 'center' });

  // Save PDF
  doc.save(`Ticket_${ticketId}.pdf`);
}

