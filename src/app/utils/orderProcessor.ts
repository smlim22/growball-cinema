import { supabase } from '@/app/lib/supabaseClient';
import { CartItem } from '@/app/types/pos';
import { generateReceiptPDF, generateTicketPDF } from './pdfGenerator';

interface ProcessOrderResult {
  success: boolean;
  orderId?: number;
  orderNumber?: string;
  error?: string;
}

// Generate order number (format: ORD-YYYYMMDD-HHMMSS-XXXX)
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

// Get current staff ID from auth
async function getCurrentStaffId(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('staff')
      .select('staff_id')
      .eq('uuid', user.id)
      .single();

    if (error || !data) return null;
    return data.staff_id;
  } catch (err) {
    console.error('Error getting staff ID:', err);
    return null;
  }
}

export async function processOrder(
  items: CartItem[],
  paymentMethod: 'cash' | 'card',
  referenceNumber?: number
): Promise<ProcessOrderResult> {
  try {
    // Get staff ID
    const staffId = await getCurrentStaffId();
    if (!staffId) {
      return { success: false, error: 'Unable to identify staff member. Please log in again.' };
    }

    // Separate F&B and ticket items
    const fnbItems = items.filter(item => item.type === 'fnb');
    const ticketItems = items.filter(item => item.type === 'ticket');

    if (fnbItems.length === 0 && ticketItems.length === 0) {
      return { success: false, error: 'No items to process.' };
    }

    const now = new Date();
    const orderDate = now.toISOString().split('T')[0];
    const orderTime = now.toTimeString().split(' ')[0];

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price, 0);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order (for F&B items, we'll use a placeholder customer ID or null)
    // Note: Based on ERD, cust_id might be required. Using null or a default customer
    const { data: orderData, error: orderError } = await supabase
      .from('order')
      .insert([
        {
          order_date: orderDate,
          order_time: orderTime,
          payment_method: paymentMethod,
          status: 'Completed',
          cust_id: null, // POS orders might not have a customer
          staff_id: staffId,
          card_reference_number: paymentMethod === 'card' ? referenceNumber : null,
        },
      ])
      .select('order_id')
      .single();

    if (orderError || !orderData) {
      console.error('Error creating order:', orderError);
      return { success: false, error: 'Failed to create order. Please try again.' };
    }

    const orderId = orderData.order_id;

    // Create order list items for F&B
    if (fnbItems.length > 0) {
      const orderListItems = fnbItems.map(item => ({
        fnb_id: item.fnbId!,
        order_id: orderId,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: orderListError } = await supabase
        .from('order_list')
        .insert(orderListItems);

      if (orderListError) {
        console.error('Error creating order list:', orderListError);
        // Rollback order? Or continue with tickets?
        return { success: false, error: 'Failed to create order items. Please try again.' };
      }
    }

    // Create tickets and seat_taken entries
    const ticketIds: number[] = [];
    
    for (const ticketItem of ticketItems) {
      if (!ticketItem.showtimeId) {
        console.error('Missing showtime ID for ticket item');
        continue;
      }

      // Create ticket (using null for customer ID for POS)
      const { data: ticketData, error: ticketError } = await supabase
        .from('ticket')
        .insert([
          {
            showtime_id: ticketItem.showtimeId,
            cust_id: null, // POS tickets might not have a customer
          },
        ])
        .select('ticket_id')
        .single();

      if (ticketError || !ticketData) {
        console.error('Error creating ticket:', ticketError);
        continue;
      }

      const ticketId = ticketData.ticket_id;
      ticketIds.push(ticketId);

      // Create seat_taken entries for each seat
      if (ticketItem.seats && ticketItem.seats.length > 0) {
        const seatTakenEntries = ticketItem.seats.map(seatNo => ({
          seat_no: seatNo,
          ticket_id: ticketId,
          // showtime_id: ticketItem.showtimeId, // Include showtime_id if table supports it
          date: ticketItem.showtime?.date || orderDate,
          status: 'booked',
        }));

        const { error: seatTakenError } = await supabase
          .from('seat_taken')
          .insert(seatTakenEntries);

        if (seatTakenError) {
          console.error('Error creating seat_taken entries:', seatTakenError);
          // Try without showtime_id if it fails (in case table doesn't have that column)
          const seatTakenEntriesWithoutShowtime = ticketItem.seats.map(seatNo => ({
            seat_no: seatNo,
            ticket_id: ticketId,
            date: ticketItem.showtime?.date || orderDate,
            status: 'booked',
          }));

          const { error: retryError } = await supabase
            .from('seat_taken')
            .insert(seatTakenEntriesWithoutShowtime);

          if (retryError) {
            console.error('Error creating seat_taken entries (retry):', retryError);
          }
        }
      }
    }

    // Generate PDFs
    try {
      // Generate receipt for F&B items
      if (fnbItems.length > 0) {
        const fnbTotal = fnbItems.reduce((sum, item) => sum + item.price, 0);
        await generateReceiptPDF(orderNumber, fnbItems, fnbTotal, paymentMethod, referenceNumber);
      }

      // Generate ticket PDFs
      for (let i = 0; i < ticketItems.length; i++) {
        const ticketItem = ticketItems[i];
        const ticketId = ticketIds[i];
        if (ticketId) {
          await generateTicketPDF(ticketId, ticketItem, orderNumber);
        }
      }
    } catch (pdfError) {
      console.error('Error generating PDFs:', pdfError);
      // Don't fail the order if PDF generation fails
    }

    return {
      success: true,
      orderId,
      orderNumber,
    };
  } catch (err: any) {
    console.error('Error processing order:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred. Please try again.',
    };
  }
}

