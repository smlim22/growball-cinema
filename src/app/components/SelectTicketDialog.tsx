'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Button } from '@radix-ui/themes';

export default function SelectTicketDialog({ onBack, onAddItem }: any) {
  const [step, setStep] = useState<'movie' | 'showtime' | 'seat'>('movie');
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('movie').select('*').then(({ data }) => setMovies(data || []));
  }, []);

  const fetchShowtimes = async (movie_id: number) => {
    const { data } = await supabase.from('showtimes').select('*').eq('movie_id', movie_id);
    setShowtimes(data || []);
    setStep('showtime');
  };

  const fetchSeats = async (showtime_id: number) => {
    const { data } = await supabase
      .from('seat')
      .select('seat_no, seat_type')
      .order('seat_no');
    const { data: taken } = await supabase
      .from('seat_taken')
      .select('seat_no')
      .eq('showtime_id', showtime_id)
      .eq('status', 'booked');
    const takenSeats = new Set(taken?.map(s => s.seat_no));
    const layout = data?.map(s => ({
      ...s,
      taken: takenSeats.has(s.seat_no),
    }));
    setSeats(layout || []);
    setStep('seat');
  };

  const toggleSeat = (seat_no: string) => {
    setSelectedSeats(prev =>
      prev.includes(seat_no) ? prev.filter(s => s !== seat_no) : [...prev, seat_no]
    );
  };

  const confirmSelection = () => {
    onAddItem({
      type: 'ticket',
      name: selectedMovie.movie_name,
      quantity: selectedSeats.length,
      price: selectedSeats.length * selectedMovie.ticket_price,
    });
    onBack();
  };

  return (
    <div>
      {step === 'movie' && (
        <>
          <h2 className="text-lg font-bold mb-2">Select Movie</h2>
          <ul className="space-y-2">
            {movies.map(m => (
              <li key={m.movie_id}>
                <Button onClick={() => { setSelectedMovie(m); fetchShowtimes(m.movie_id); }}>
                  {m.movie_name}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      {step === 'showtime' && (
        <>
          <Button onClick={() => setStep('movie')}>← Back</Button>
          <h2 className="text-lg font-bold mb-2 mt-2">Select Showtime</h2>
          {showtimes.map(st => (
            <Button key={st.showtime_id} onClick={() => { setSelectedShowtime(st); fetchSeats(st.showtime_id); }}>
              {st.date} {st.time}
            </Button>
          ))}
        </>
      )}

      {step === 'seat' && (
        <>
          <Button onClick={() => setStep('showtime')}>← Back</Button>
          <h2 className="text-lg font-bold mb-2 mt-2">Select Seats</h2>
          <div className="grid grid-cols-8 gap-2 mt-3">
            {seats.map(s => (
              <button
                key={s.seat_no}
                disabled={s.taken}
                onClick={() => toggleSeat(s.seat_no)}
                className={`p-2 rounded ${
                  s.taken
                    ? 'bg-gray-400 cursor-not-allowed'
                    : selectedSeats.includes(s.seat_no)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {s.seat_no}
              </button>
            ))}
          </div>

          <Button className="mt-4" onClick={confirmSelection}>
            Add {selectedSeats.length} Ticket(s)
          </Button>
        </>
      )}
    </div>
  );
}
