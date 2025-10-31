'use client'
import { Theme, Button, Callout } from '@radix-ui/themes';
import { useEffect, useState } from "react";
import { PlusIcon, Pencil2Icon, CheckCircledIcon } from "@radix-ui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from '@/app/lib/supabaseClient';

// Updated type to allow 'movie' to be null, fixing the TypeScript error
type Showtime = {
  showtime_id: number;
  movie_id: number;
  movie: { movie_name: string | null } | null; // <-- Allows movie to be null
  date: string;
  time: string;
  hall_id: number;
  status: string;
};

type Hall = {
  hall_id: number;
  hall_type: string;
};

export default function SchedulePage() {
  const router = useRouter();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHall, setSelectedHall] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("earliest");

  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  // Set today's date as default
  useEffect(() => {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0]; // YYYY-MM-DD
    setSelectedDate(formatted);
  }, []);

  // Fetch halls (runs only once on component mount)
  useEffect(() => {
    const fetchHalls = async () => {
      const { data, error } = await supabase.from("cinema_hall").select("*");
      if (error) {
        console.error("Error fetching halls", error);
      } else {
        setHalls(data ?? []);
      }
    };
    fetchHalls();
  }, []);

  // Fetch showtimes based on filters (runs when filters change)
  useEffect(() => {
    // Don't run the query if the default date hasn't been set yet
    if (!selectedDate) return;

    const fetchShowtime = async () => {
      // Start building the query
      let query = supabase
        .from("showtimes")
        .select("*, movie(movie_name)");

      // 1. Add date filter (always applied)
      query = query.eq('date', selectedDate);

      // 2. Add hall filter (only if one is selected)
      if (selectedHall) {
        query = query.eq('hall_id', Number(selectedHall));
      }

      // 3. Add sorting
      query = query.order('time', { ascending: sortOrder === 'earliest' });

      // Execute the final query
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching showtimes", error);
      } else {
        setShowtimes(data ?? []);
      }
    };

    fetchShowtime();
  }, [selectedDate, selectedHall, sortOrder]);


  // Format date (DD/MM/YYYY) and time (hh:mm AM/PM)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB"); // 25/10/2025
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="py-10 px-12 font-inter">
      <Theme className="inline">
        {/* Header (no change) */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-inter">Schedule</h1>
          <Button
            color="green"
            size="2"
            variant="solid"
            type="button"
            onClick={() => router.push("/manager/schedule/add-showtime")}
          >
            <PlusIcon />
            Add Showtime
          </Button>
        </div>

        {success && (
          <Callout.Root color="green" size="2" variant="soft" className="mb-4">
            <Callout.Icon><CheckCircledIcon /></Callout.Icon>
            <Callout.Text className='font-inter'>Showtime added successfully!</Callout.Text>
          </Callout.Root>
        )}

        {/* Filters (no change) */}
        <div className="flex flex-wrap items-center bg-white shadow-sm rounded-lg p-4 mb-5 gap-3 font-inter">
          {/* Hall filter */}
          <div className="flex flex-row items-center gap-x-1">
            <label>Cinema Hall:</label>
            <select
              className="border border-gray-300 p-2 rounded-md"
              value={selectedHall}
              onChange={(e) => setSelectedHall(parseInt(e.target.value, 10))}
            >
              {halls.map(hall => (
                <option key={hall.hall_id} value={hall.hall_id}>
                  {hall.hall_id === 9 ? `Hall ${hall.hall_id} (${hall.hall_type})` : `Hall ${hall.hall_id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div className="flex flex-row items-center gap-x-1">
            <label>Date:</label>
            <input
              type="date"
              className="border border-gray-300 p-2 rounded-md"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Sort filter */}
          <div className="flex flex-row items-center gap-x-1">
            <label>Sort By:</label>
            <select
              className="border border-gray-300 p-2 rounded-md"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="earliest">Earliest</option>
              <option value="latest">Latest</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="min-w-full bg-white shadow-md rounded-lg border-collapse border overflow-hidden font-inter">
          <thead className="bg-signature-red text-white">
            <tr>
              <th className="border border-signature-red py-3 px-6 text-left">Date</th>
              <th className="border border-signature-red py-3 px-6 text-left">Time</th>
              <th className="border border-signature-red py-3 px-6 text-left">Movie Name</th>
              <th className="border border-signature-red py-3 px-6 text-left">Status</th>
              <th className="border border-signature-red py-3 px-6 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showtimes.length > 0 ? (
              showtimes.map((showtime) => (
                <tr key={showtime.showtime_id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6">{formatDate(showtime.date)}</td>
                  <td className="py-3 px-6">{formatTime(showtime.time)}</td>
                  <td className="py-3 px-6">{showtime.movie?.movie_name}</td>
                  <td className="py-3 px-6">{showtime.status}</td>
                  <td className="py-3 px-6">
                    <Button
                      color="amber"
                      size="2"
                      variant="solid"
                      onClick={() => router.push(`/manager/schedule/update-showtime/${showtime.showtime_id}`)}
                    >
                      <Pencil2Icon />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3 px-6 text-center" colSpan={5}>
                  No showtimes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Theme>
    </div>
  );
}