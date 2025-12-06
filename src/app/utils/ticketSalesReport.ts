import { supabase } from '@/app/lib/supabaseClient';
import { generateTicketSalesSummaryPDF, TicketSalesSummaryData } from './pdfGenerator';

// Fetch detailed ticket sales data and generate PDF
export async function generateTicketSalesReportPDF(
  startDate: string,
  endDate: string
): Promise<void> {
  try {
    // Fetch showtimes in the date range
    const { data: showtimesData, error: showtimesError } = await supabase
      .from('showtimes')
      .select('showtime_id, date, time, movie_id, adult_price, child_price, senior_price')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (showtimesError) {
      console.error('Error fetching showtimes:', showtimesError);
      throw new Error('Failed to fetch showtimes data');
    }

    if (!showtimesData || showtimesData.length === 0) {
      // No showtimes in range, create empty report
      const emptyData: TicketSalesSummaryData[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        emptyData.push({
          date: d.toISOString().split('T')[0],
          count: 0,
          revenue: 0,
          details: []
        });
      }
      
      await generateTicketSalesSummaryPDF(startDate, endDate, emptyData);
      return;
    }

    // Get all showtime IDs
    const showtimeIds = showtimesData.map(st => st.showtime_id);

    // Fetch all tickets for these showtimes
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('ticket')
      .select('ticket_id, showtime_id, total_price')
      .in('showtime_id', showtimeIds);

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      throw new Error('Failed to fetch tickets data');
    }

    // Fetch movie names
    const movieIds = [...new Set(showtimesData.map(st => st.movie_id))];
    const { data: moviesData, error: moviesError } = await supabase
      .from('movie')
      .select('movie_id, movie_name')
      .in('movie_id', movieIds);

    if (moviesError) {
      console.error('Error fetching movies:', moviesError);
      throw new Error('Failed to fetch movies data');
    }

    // Create a map of movie_id to movie_name
    const movieMap: { [key: number]: string } = {};
    moviesData?.forEach(movie => {
      movieMap[movie.movie_id] = movie.movie_name;
    });

    // Create a map of showtime_id to showtime data
    const showtimeMap: { [key: number]: typeof showtimesData[0] } = {};
    showtimesData.forEach(st => {
      showtimeMap[st.showtime_id] = st;
    });

    // Group tickets by showtime - count and sum revenue
    const ticketsByShowtime: { [key: number]: { count: number; revenue: number } } = {};
    
    ticketsData?.forEach((ticket: any) => {
      if (!ticketsByShowtime[ticket.showtime_id]) {
        ticketsByShowtime[ticket.showtime_id] = { count: 0, revenue: 0 };
      }
      ticketsByShowtime[ticket.showtime_id].count++;
      // Sum up total_price from each ticket
      ticketsByShowtime[ticket.showtime_id].revenue += ticket.total_price || 0;
    });

    // Group by date
    const salesByDate: { [key: string]: TicketSalesSummaryData } = {};
    
    // Initialize all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      salesByDate[dateStr] = {
        date: dateStr,
        count: 0,
        revenue: 0,
        details: []
      };
    }

    // Process each showtime
    Object.entries(ticketsByShowtime).forEach(([showtimeIdStr, ticketData]) => {
      const showtimeId = parseInt(showtimeIdStr);
      const showtime = showtimeMap[showtimeId];
      
      if (!showtime) return;

      const date = showtime.date;
      const movieName = movieMap[showtime.movie_id] || 'Unknown Movie';
      const totalTickets = ticketData.count;
      const revenue = ticketData.revenue; // Use actual total_price from tickets

      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          count: 0,
          revenue: 0,
          details: []
        };
      }

      salesByDate[date].count += totalTickets;
      salesByDate[date].revenue += revenue;
      salesByDate[date].details.push({
        movieName,
        showtime: showtime.time,
        date: showtime.date,
        tickets: totalTickets,
        revenue
      });
    });

    // Convert to array and sort by date
    const salesData: TicketSalesSummaryData[] = Object.values(salesByDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Generate PDF
    await generateTicketSalesSummaryPDF(startDate, endDate, salesData);
  } catch (error) {
    console.error('Error generating ticket sales report:', error);
    throw error;
  }
}

