import { supabase } from '@/app/lib/supabaseClient';
import { generateFNBSalesSummaryPDF, FNBSalesTableRow } from './pdfGenerator';

// Fetch detailed FNB sales data and generate PDF
export async function generateFNBSalesReportPDF(
  startDate: string,
  endDate: string
): Promise<void> {
  try {
    // Fetch orders in the date range
    const { data: ordersData, error: ordersError } = await supabase
      .from('order')
      .select('order_id, order_date')
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .order('order_date', { ascending: true });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw new Error('Failed to fetch orders data');
    }

    if (!ordersData || ordersData.length === 0) {
      // No orders in range, create empty report
      const emptyData: FNBSalesTableRow[] = [];
      await generateFNBSalesSummaryPDF(startDate, endDate, emptyData);
      return;
    }

    // Get all order IDs
    const orderIds = ordersData.map(o => o.order_id);

    // Fetch order_list items with FNB information
    const { data: orderListData, error: orderListError } = await supabase
      .from('order_list')
      .select('order_id, quantity, price, fnb(fnb_id, fnb_name)')
      .in('order_id', orderIds);

    if (orderListError) {
      console.error('Error fetching order list:', orderListError);
      throw new Error('Failed to fetch order list data');
    }

    if (!orderListData || orderListData.length === 0) {
      // No FNB items in orders, create empty report
      const emptyData: FNBSalesTableRow[] = [];
      await generateFNBSalesSummaryPDF(startDate, endDate, emptyData);
      return;
    }

    // Create a map of order_id to order_date
    const orderToDate: { [key: number]: string } = {};
    ordersData.forEach(order => {
      orderToDate[order.order_id] = order.order_date;
    });

    // Group FNB items by date and item name using a more robust structure
    const salesByDateAndItem: { [date: string]: { [itemName: string]: { quantity: number; revenue: number } } } = {};

    orderListData.forEach((item: any) => {
      const orderDate = orderToDate[item.order_id];
      if (!orderDate) return;

      const fnbItem = item.fnb;
      if (!fnbItem) return;

      const itemName = fnbItem.fnb_name || 'Unknown Item';

      if (!salesByDateAndItem[orderDate]) {
        salesByDateAndItem[orderDate] = {};
      }

      if (!salesByDateAndItem[orderDate][itemName]) {
        salesByDateAndItem[orderDate][itemName] = {
          quantity: 0,
          revenue: 0
        };
      }

      salesByDateAndItem[orderDate][itemName].quantity += item.quantity || 0;
      salesByDateAndItem[orderDate][itemName].revenue += item.price || 0;
    });

    // Convert to array format
    const salesData: FNBSalesTableRow[] = [];
    Object.entries(salesByDateAndItem).forEach(([date, items]) => {
      Object.entries(items).forEach(([itemName, data]) => {
        salesData.push({
          date,
          itemName,
          quantity: data.quantity,
          revenue: data.revenue
        });
      });
    });

    // Sort by date first, then by item name
    salesData.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.itemName.localeCompare(b.itemName);
    });

    // Generate PDF
    await generateFNBSalesSummaryPDF(startDate, endDate, salesData);
  } catch (error) {
    console.error('Error generating FNB sales report:', error);
    throw error;
  }
}