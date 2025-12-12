'use client'
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Theme, Callout } from '@radix-ui/themes';
import Spinner from '@/app/components/Spinner';
import Link from 'next/link';

type Showtime = {
  showtime_id: number;
  movie_id: number;
  movie: { movie_name: string | null } | null;
  date: string;
  time: string;
  hall_id: number;
  status: string;
  adult_price: number;
  child_price: number;
  senior_price: number;
  cinema_hall: { hall_type: string | null } | null;
};

export default function ShowtimeDetailsPage() {
  const params = useParams();
  const showtimeId = params['showtime-id'];
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  useEffect(() => {
    const fetchShowtime = async () => {
      if (!showtimeId) {
        console.warn("No showtime ID found in params:", params);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("showtimes")
        .select("*, movie (movie_name), cinema_hall (hall_type)")
        .eq("showtime_id", showtimeId)
        .single();

      if (error) {
        console.error("Error fetching showtime:", error);
      } else {
        setShowtime(data);
      }
      setLoading(false);
    };

    fetchShowtime();
  }, [showtimeId]);

  if (loading) {
    return <Spinner />;
  }

  if (!showtime) {
    return (
      <Theme className="inline">
        <Callout.Root color="red" size="2" variant="soft" className="font-inter mx-12 my-10">
          <Callout.Text className='font-inter'>Showtime not found.</Callout.Text>
        </Callout.Root>
      </Theme>
    );
  }
  
  return (
    <div className='py-10 px-12 font-inter'>
      <h1 className="text-2xl font-bold font-inter mb-4">Showtime Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Link
          href="/manager/schedule"
          className="text-black hover:underline mb-4 flex gap-1 items-center font-inter"
        >
          <ArrowLeftIcon />
          Back
        </Link>
        
        <hr className="my-2 text-gray-300" />

        <table className="min-w-full border border-collapse border-gray-200 rounded-md font-inter mt-4">
          <tbody>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Name</td>
              <td className="border border-gray-200 py-3 px-4">{showtime.movie?.movie_name}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Date</td>
              <td className="border border-gray-200 py-3 px-4">{formatDate(showtime.date)}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Time</td>
              <td className="border border-gray-200 py-3 px-4">{formatTime(showtime.time)}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Hall</td>
              <td className="border border-gray-200 py-3 px-4">Hall {showtime.hall_id}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Hall Type</td>
              <td className="border border-gray-200 py-3 px-4">{showtime.cinema_hall?.hall_type}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Status</td>
              <td className="border border-gray-200 py-3 px-4">{showtime.status}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Adult Price (RM)</td>
              <td className="border border-gray-200 py-3 px-4">{showtime.adult_price.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Child Price (RM)</td>
              <td className="border border-gray-200 py-3 px-4">{showtime.child_price.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Senior Price (RM)</td>
              <td className="border border-gray-200 py-3 px-4">{showtime.senior_price.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}