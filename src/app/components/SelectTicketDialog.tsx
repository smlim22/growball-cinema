'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Button, Theme } from '@radix-ui/themes';
import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { CartItem } from '@/app/types/pos';

interface SelectTicketDialogProps {
  onBack: () => void;
  onAddItem: (items: CartItem[]) => void;
}

export default function SelectTicketDialog({ onBack, onAddItem }: SelectTicketDialogProps) {
  const [step, setStep] = useState<'movie' | 'showtime' | 'seat'>('movie');
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const today = new Date().toISOString().split("T")[0];

  const [adultQty, setAdultQty] = useState(0);
  const [seniorQty, setSeniorQty] = useState(0);
  const [childQty, setChildQty] = useState(0);

  useEffect(() => {
    supabase.from('movie').select('*').order('movie_name').then(({ data }) => setMovies(data || []));
  }, []);

  const fetchShowtimes = async (movie_id: number) => {
    const { data } = await supabase
      .from('showtimes')
      .select('*')
      .eq('movie_id', movie_id)
      .eq('status', 'Available')
      .gte('date', today)
      .order('date', { ascending: true });
    setShowtimes(data || []);
    setStep('showtime');
  };

  const fetchSeats = async (showtime_id: number) => {
    try {
      // Step 1: Get the showtime to retrieve hall_id
      const { data: showtimeData, error: showtimeError } = await supabase
        .from('showtimes')
        .select('hall_id')
        .eq('showtime_id', showtime_id)
        .single();

      if (showtimeError || !showtimeData) {
        console.error('Error fetching showtime:', showtimeError);
        return;
      }

      const hallId = showtimeData.hall_id;

      // Step 2: Get all seats for this hall (Seat table has composite PK: seat_no + hall_id)
      const { data: seatsData, error: seatsError } = await supabase
        .from('seat')
        .select('seat_no, seat_type')
        .eq('hall_id', hallId)
        .order('seat_no');

      if (seatsError) {
        console.error('Error fetching seats:', seatsError);
        return;
      }

      // Step 3: Get all tickets for this showtime
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('ticket')
        .select('ticket_id')
        .eq('showtime_id', showtime_id);

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        return;
      }

      // Step 4: Get all seat_taken entries for these tickets (where status = 'booked')
      const ticketIds = ticketsData?.map(t => t.ticket_id) || [];
      let takenSeats = new Set<string>();

      if (ticketIds.length > 0) {
        const { data: seatTakenData, error: seatTakenError } = await supabase
          .from('seat_taken')
          .select('seat_no')
          .in('ticket_id', ticketIds)
          .eq('status', 'booked');

        if (seatTakenError) {
          console.error('Error fetching seat_taken:', seatTakenError);
        } else {
          // Create a set of taken seat numbers for this hall
          takenSeats = new Set(seatTakenData?.map(st => st.seat_no) || []);
        }
      }

      // Step 5: Map seats with taken status
      const layout = seatsData?.map(seat => ({
        ...seat,
        taken: takenSeats.has(seat.seat_no),
      })) || [];

      setSeats(layout);
      setStep('seat');
    } catch (err) {
      console.error('Error in fetchSeats:', err);
    }
  };

  const toggleSeat = (seat_no: string) => {
    setSelectedSeats(prev =>
      prev.includes(seat_no) ? prev.filter(s => s !== seat_no) : [...prev, seat_no]
    );
  };

  const confirmSelection = () => {
    // Validate that ticket count matches selected seats
    const totalTickets = adultQty + seniorQty + childQty;
    
    if (totalTickets === 0) {
      alert('Please select at least one ticket.');
      return;
    }
    
    if (totalTickets !== selectedSeats.length) {
      alert(`Please select ${totalTickets} seat(s) to match your ticket selection.`);
      return;
    }

    const totalPrice = 
      (adultQty * selectedShowtime.adult_price) +
      (seniorQty * selectedShowtime.senior_price) +
      (childQty * selectedShowtime.child_price);

    // Generate unique ID for this cart item
    const itemId = `ticket-${selectedShowtime.showtime_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const cartItem: CartItem = {
      id: itemId,
      type: 'ticket',
      name: selectedMovie.movie_name,
      quantity: totalTickets,
      price: totalPrice, // Total price for all tickets
      unitPrice: totalPrice / totalTickets, // Average price per ticket
      movieId: selectedMovie.movie_id,
      movieName: selectedMovie.movie_name,
      showtimeId: selectedShowtime.showtime_id,
      showtime: {
        date: selectedShowtime.date,
        time: selectedShowtime.time,
      },
      seats: [...selectedSeats], // Copy array
      ticketBreakdown: {
        adult: adultQty,
        senior: seniorQty,
        child: childQty,
      },
    };

    // Pass as array for consistency
    onAddItem([cartItem]);
    // Dialog will be closed by parent AddItemDialog
  };

  // Helper: format date to DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB'); // e.g. 25/10/2025
  };

  // Helper: format time to 12-hour AM/PM
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Group showtimes by date
  const groupedShowtimes = showtimes.reduce((acc: any, st: any) => {
    if (!acc[st.date]) acc[st.date] = [];
    acc[st.date].push(st);
    return acc;
  }, {});

  return (
    <div className="font-inter">
      {step === 'movie' && (
        <>
          <a onClick={onBack} className="cursor-pointer flex gap-1 items-center hover:underline mb-3">
            <ArrowLeftIcon /> Back
          </a>
          <h2 className="text-lg font-bold mb-3">Select Movie</h2>
          <ul>
            {movies.map(m => (
              <li
                key={m.movie_id}
                onClick={() => { setSelectedMovie(m); fetchShowtimes(m.movie_id); }}
                className="p-3 border border-gray-200 rounded-md cursor-pointer mb-2 hover:bg-gray-100 transition"
              >
                {m.movie_name}
              </li>
            ))}
          </ul>
        </>
      )}

      {step === 'showtime' && (
        <>
          <a onClick={() => setStep('movie')} className="cursor-pointer flex gap-1 items-center hover:underline">
            <ArrowLeftIcon /> Back
          </a>
          <h2 className="text-lg font-bold my-3">Select Showtime</h2>

          {Object.keys(groupedShowtimes).map(date => (
            <div key={date} className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">{formatDate(date)}</h3>
              <div className="flex flex-wrap gap-2">
                {groupedShowtimes[date].map((st: any) => (
                  <button
                    key={st.showtime_id}
                    onClick={() => { setSelectedShowtime(st); fetchSeats(st.showtime_id); }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                  >
                    {formatTime(st.time)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {step === 'seat' && (
      <div className="flex gap-4">
        {/* LEFT COLUMN — SEAT SELECTOR */}
        <div className="flex-1">
          <a
            onClick={() => setStep('showtime')}
            className="cursor-pointer flex gap-1 items-center hover:underline mb-2"
          >
            <ArrowLeftIcon /> Back
          </a>

          <h2 className="text-lg font-bold my-2 text-center">Select Seats</h2>

          <div className="bg-gray-50 p-4 rounded-lg shadow-inner max-h-[70vh] overflow-auto">
            {/* Screen bar */}
            <div className="relative flex justify-center mb-6">
              <div className="w-3/4 h-4 border-t-4 border-gray-400 rounded-t-full"></div>
              <span className="absolute top-0 text-xs tracking-widest text-gray-600">SCREEN</span>
            </div>

            <div className="flex flex-col gap-3 items-center">
              {Array.from(new Set(seats.map(s => s.seat_no.charAt(0)))).map(row => {
                const rowSeats = seats.filter(s => s.seat_no.startsWith(row));

                return (
                  <div key={row} className="flex items-center justify-center gap-2">
                    <span className="w-5 text-gray-600 font-medium">{row}</span>

                    <div className="flex flex-1 gap-1 justify-center">
                      {rowSeats.map((s, i) => (
                        <button
                          key={s.seat_no}
                          disabled={s.taken}
                          onClick={() => toggleSeat(s.seat_no)}
                          className={`w-8 h-8 text-xs rounded font-medium transition
                            ${
                              s.taken
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : selectedSeats.includes(s.seat_no)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }
                            ${i === 2 || i === 14 ? 'ml-4' : ''}
                          `}
                        >
                          {s.seat_no}
                        </button>
                      ))}
                    </div>

                    <span className="w-5 text-gray-600 font-medium">{row}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-3 mb-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-gray-200 rounded"></span> Available
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-600 rounded"></span> Selected
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-gray-400 rounded"></span> Taken
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — CATEGORY PANEL */}
        <div className="w-64 p-4 mt-4 h-fit max-h-[70vh] overflow-auto">

          {[
            { label: "Adult", price: selectedShowtime.adult_price, qty: adultQty, setQty: setAdultQty },
            { label: "Senior", price: selectedShowtime.senior_price, qty: seniorQty, setQty: setSeniorQty },
            { label: "Children", price: selectedShowtime.child_price, qty: childQty, setQty: setChildQty },
          ].map(cat => (
            <div key={cat.label} className="flex justify-between items-center py-2">
              <span>{cat.label}</span>

              <span className="text-sm text-gray-700">
                RM {cat.price.toFixed(2)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => cat.setQty(Math.max(0, cat.qty - 1))}
                  className="w-6 h-6 rounded-full bg-gray-300 text-black flex items-center justify-center"
                >
                  –
                </button>

                <span className="w-4 text-center">{cat.qty}</span>

                <button
                  onClick={() => {
                    const total = adultQty + seniorQty + childQty;
                    if (total < selectedSeats.length) {
                      cat.setQty(cat.qty + 1);
                    }
                  }}
                  className="w-6 h-6 rounded-full bg-gray-300 text-black flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {/* <div className="text-start text-sm text-gray-700 mt-3">
            Total Tickets: {adultQty + seniorQty + childQty}
          </div> */}

          <Theme className="mt-4">
            <Button color="green" onClick={confirmSelection} style={{ width: '100%' }}>
              <PlusIcon />
              Add {selectedSeats.length} Ticket(s)
            </Button>
          </Theme>

        </div>
      </div>
    )}
    </div>
  );
}