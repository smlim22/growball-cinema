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

    if (!ticketsData || ticketsData.length === 0) {
      // No tickets, create empty report
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

    // Get all ticket IDs
    const ticketIds = ticketsData.map(t => t.ticket_id);

    // Fetch all seat_taken entries for these tickets (where status = 'booked')
    const { data: seatTakenData, error: seatTakenError } = await supabase
      .from('seat_taken')
      .select('ticket_id')
      .in('ticket_id', ticketIds)
      .eq('status', 'booked');

    if (seatTakenError) {
      console.error('Error fetching seat_taken:', seatTakenError);
      throw new Error('Failed to fetch seat_taken data');
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

    // Create a map of ticket_id to showtime_id and total_price
    const ticketToShowtime: { [key: number]: { showtimeId: number; totalPrice: number } } = {};
    ticketsData.forEach(ticket => {
      ticketToShowtime[ticket.ticket_id] = {
        showtimeId: ticket.showtime_id,
        totalPrice: ticket.total_price || 0
      };
    });

    // Group seats taken and revenue by showtime
    // Count seats taken per showtime, sum revenue from tickets per showtime
    const salesByShowtime: { [key: number]: { seatCount: number; revenue: number } } = {};
    
    // Initialize all showtimes
    showtimeIds.forEach(showtimeId => {
      salesByShowtime[showtimeId] = { seatCount: 0, revenue: 0 };
    });

    // Count seats taken per showtime
    seatTakenData?.forEach((seatTaken: any) => {
      const ticketInfo = ticketToShowtime[seatTaken.ticket_id];
      if (ticketInfo) {
        if (!salesByShowtime[ticketInfo.showtimeId]) {
          salesByShowtime[ticketInfo.showtimeId] = { seatCount: 0, revenue: 0 };
        }
        salesByShowtime[ticketInfo.showtimeId].seatCount++;
      }
    });

    // Sum revenue from tickets per showtime (each ticket's total_price counted once per ticket)
    ticketsData?.forEach((ticket: any) => {
      if (!salesByShowtime[ticket.showtime_id]) {
        salesByShowtime[ticket.showtime_id] = { seatCount: 0, revenue: 0 };
      }
      salesByShowtime[ticket.showtime_id].revenue += ticket.total_price || 0;
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
    Object.entries(salesByShowtime).forEach(([showtimeIdStr, salesData]) => {
      const showtimeId = parseInt(showtimeIdStr);
      const showtime = showtimeMap[showtimeId];
      
      if (!showtime) return;

      const date = showtime.date;
      const movieName = movieMap[showtime.movie_id] || 'Unknown Movie';
      const totalSeats = salesData.seatCount; // Count of seats taken
      const revenue = salesData.revenue; // Sum of total_price from tickets

      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          count: 0,
          revenue: 0,
          details: []
        };
      }

      salesByDate[date].count += totalSeats;
      salesByDate[date].revenue += revenue;
      salesByDate[date].details.push({
        movieName,
        showtime: showtime.time,
        date: showtime.date,
        tickets: totalSeats, // This now represents seats taken (tickets sold)
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

