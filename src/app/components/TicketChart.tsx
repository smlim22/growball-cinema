'use client'
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { supabase } from '@/app/lib/supabaseClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TicketChartProps {
    startDate: string,
    endDate: string
}

interface TicketSalesData {
    date: string;
    count: number;
}

export default function TicketChart({startDate, endDate} : TicketChartProps) {
    const [salesData, setSalesData] = useState<TicketSalesData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTicketSales = async () => {
            if (!startDate || !endDate) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // First, get all showtimes in the date range
                const { data: showtimesData, error: showtimesError } = await supabase
                    .from('showtimes')
                    .select('showtime_id, date')
                    .gte('date', startDate)
                    .lte('date', endDate);

                if (showtimesError) {
                    console.error('Error fetching showtimes:', showtimesError);
                    setLoading(false);
                    return;
                }

                if (!showtimesData || showtimesData.length === 0) {
                    // No showtimes in range, fill with zeros
                    const filledSales: TicketSalesData[] = [];
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        filledSales.push({
                            date: d.toISOString().split('T')[0],
                            count: 0
                        });
                    }
                    setSalesData(filledSales);
                    setLoading(false);
                    return;
                }

                // Get all showtime IDs
                const showtimeIds = showtimesData.map(st => st.showtime_id);

                // Fetch all tickets for these showtimes
                const { data: ticketsData, error: ticketsError } = await supabase
                    .from('ticket')
                    .select('ticket_id, showtime_id')
                    .in('showtime_id', showtimeIds);

                if (ticketsError) {
                    console.error('Error fetching tickets:', ticketsError);
                    setLoading(false);
                    return;
                }

                if (!ticketsData || ticketsData.length === 0) {
                    // No tickets, fill with zeros
                    const filledSales: TicketSalesData[] = [];
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        filledSales.push({
                            date: d.toISOString().split('T')[0],
                            count: 0
                        });
                    }
                    setSalesData(filledSales);
                    setLoading(false);
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
                    setLoading(false);
                    return;
                }

                // Create a map of ticket_id to showtime_id
                const ticketToShowtime: { [key: number]: number } = {};
                ticketsData.forEach(ticket => {
                    ticketToShowtime[ticket.ticket_id] = ticket.showtime_id;
                });

                // Create a map of showtime_id to date
                const showtimeToDate: { [key: number]: string } = {};
                showtimesData.forEach(st => {
                    showtimeToDate[st.showtime_id] = st.date;
                });

                // Group seats taken by date
                const salesByDate: { [key: string]: number } = {};
                
                seatTakenData?.forEach((seatTaken: any) => {
                    const showtimeId = ticketToShowtime[seatTaken.ticket_id];
                    if (showtimeId) {
                        const date = showtimeToDate[showtimeId];
                        if (date) {
                            salesByDate[date] = (salesByDate[date] || 0) + 1;
                        }
                    }
                });

                // Convert to array and sort by date
                const salesArray: TicketSalesData[] = Object.entries(salesByDate)
                    .map(([date, count]) => ({
                        date,
                        count: count as number
                    }))
                    .sort((a, b) => a.date.localeCompare(b.date));

                // Fill in missing dates with 0
                const filledSales: TicketSalesData[] = [];
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    const existingData = salesArray.find(s => s.date === dateStr);
                    filledSales.push({
                        date: dateStr,
                        count: existingData?.count || 0
                    });
                }

                setSalesData(filledSales);
            } catch (error) {
                console.error('Error processing ticket sales:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketSales();
    }, [startDate, endDate]);

    const chartData = {
        labels: salesData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Ticket Sales',
                data: salesData.map(item => item.count),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `Ticket Sales from ${startDate} to ${endDate}`,
                font: {
                    size: 16,
                },
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-86 max-w-108">
                <p>Loading chart data...</p>
            </div>
        );
    }

    if (!startDate || !endDate) {
        return (
            <div className="flex items-center justify-center h-86 max-w-108">
                <p>Please select a date range to view ticket sales</p>
            </div>
        );
    }

    if (salesData.length === 0) {
        return (
            <div className="flex items-center justify-center h-86 max-w-108">
                <p>No ticket sales data found for the selected date range</p>
            </div>
        );
    }

    return (
        <div className="p-4 flex h-86 max-w-108">
            <Line data={chartData} options={chartOptions} className='mb-4'/>
        </div>
    );
}