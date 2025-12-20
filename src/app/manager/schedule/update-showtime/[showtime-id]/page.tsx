"use client";
import { Theme, Button, Callout, Spinner as Sp } from '@radix-ui/themes';
import { ArrowLeftIcon, ArchiveIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import Spinner from '@/app/components/Spinner';
import Link from 'next/link';

type Movie = {
  movie_id: number;
  movie_name: string;
  duration: number; // in minutes
};

type Hall = {
  hall_id: number;
  hall_type: string;
};

type Showtime = {
  showtime_id: number;
  movie_id: number;
  date: string;
  time: string;
  hall_id: number;
  status: string;
  adult_price: number;
  child_price: number;
  senior_price: number;
};

export default function UpdateShowtimePage() {
  const params = useParams();
  const showtimeId = params["showtime-id"];
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<number>();
  const [selectedHall, setSelectedHall] = useState<number>();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [adultPrice, setAdultPrice] = useState<number>();
  const [childPrice, setChildPrice] = useState<number>();
  const [seniorPrice, setSeniorPrice] = useState<number>();
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter();

  // Fetch current showtime
  useEffect(() => {
    const fetchShowtime = async () => {
      if (!showtimeId) {
        console.warn("No showtime ID found in params");
        return;
      }

      const { data, error } = await supabase
        .from("showtimes")
        .select("*")
        .eq("showtime_id", showtimeId)
        .single();

      if (error) {
        console.error("Error fetching showtime:", error);
      } else {
        setShowtime(data);
        setSelectedMovie(data.movie_id);
        setSelectedHall(data.hall_id);
        setDate(data.date);
        setTime(data.time.split("+")[0].slice(0, 5)); // keep only "HH:mm"
        setAdultPrice(data.adult_price);
        setChildPrice(data.child_price);
        setSeniorPrice(data.senior_price);
        setStatus(data.status);
      }
      setLoading(false)
    };

    fetchShowtime();
  }, [showtimeId]);

  // Fetch movies
  useEffect(() => {
    const fetchMovies = async () => {
      const { data, error } = await supabase
        .from("movie")
        .select("movie_id, movie_name, duration");
      if (error) console.error("Error fetching movies", error);
      else setMovies(data ?? []);
    };
    fetchMovies();
  }, []);

  // Fetch halls
  useEffect(() => {
    const fetchHalls = async () => {
      const { data, error } = await supabase.from("cinema_hall").select("*");
      if (error) console.error("Error fetching halls", error);
      else setHalls(data ?? []);
    };
    fetchHalls();
  }, []);

  // Format time with Malaysia offset for Supabase
  function timeWithMalaysiaOffset(timeHHmm: string) {
    if (!timeHHmm) return null;
    const [hh, mm] = timeHHmm.split(":");
    return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00+08`;
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const newErrors: { [key: string]: string } = {};

    if (!selectedMovie) newErrors.selectedMovie = "*Required field";
    if (!selectedHall) newErrors.selectedHall = "*Required field";
    if (!date) newErrors.date = "*Required field";
    if (!time) newErrors.time = "*Required field";
    if (!status) newErrors.status = "*Required field";
    if (adultPrice === undefined || isNaN(adultPrice) || adultPrice === 0) newErrors.adultPrice = "*Invalid adult price";
    if (childPrice === undefined || isNaN(childPrice) || childPrice === 0) newErrors.childPrice = "*Invalid child price";
    if (seniorPrice === undefined || isNaN(seniorPrice) || seniorPrice === 0) newErrors.seniorPrice = "*Invalid senior price";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setIsLoading(false);
      return;
    }

    const malaysiaTime = timeWithMalaysiaOffset(time);
    if (!malaysiaTime) {
      setErrors({ general: "*Invalid time format" });
      return;
    }

    // Get movie duration
    const movie = movies.find((m) => m.movie_id === selectedMovie);
    if (!movie) {
      setErrors({ general: "*Invalid movie selection" });
      return;
    }

    const startTime = new Date(`${date}T${time}:00+08:00`);
    const endTime = new Date(startTime.getTime() + movie.duration * 60000);
    const endWithBuffer = new Date(endTime.getTime() + 30 * 60000); // +30 min buffer

    // Fetch existing showtimes for same hall/date
    const { data: existingShowtimes, error: fetchError } = await supabase
      .from("showtimes")
      .select("*, movie (duration)")
      .eq("hall_id", selectedHall)
      .eq("date", date);

    if (fetchError) {
      console.error("Error checking existing showtimes:", fetchError);
      setErrors({ general: "*Error checking existing showtimes" });
      return;
    }

    // Check overlap (excluding the current showtime)
    const hasOverlap = existingShowtimes?.some((s) => {
      if (s.showtime_id === Number(showtimeId)) return false;
      const existingStart = new Date(`${date}T${s.time}:00`);
      const existingEnd = new Date(
        existingStart.getTime() + s.movie.duration * 60000 + 30 * 60000
      );
      return startTime < existingEnd && endWithBuffer > existingStart;
    });

    if (hasOverlap) {
      setErrors({
        general:
          "*This showtime overlaps with another or violates the 30-minute buffer rule.",
      });
      return;
    }

    // Update the showtime
    const { error } = await supabase
      .from("showtimes")
      .update({
        movie_id: selectedMovie,
        date: date,
        time: malaysiaTime,
        hall_id: selectedHall,
        status: status,
        adult_price: adultPrice,
        child_price: childPrice,
        senior_price: seniorPrice,
      })
      .eq("showtime_id", showtimeId);

    if (error) {
      console.error("Error updating showtime:", error);
      setErrors({ general: "*Error updating showtime. Please try again." });
      setIsLoading(false);
    } else {
      router.push("/manager/schedule?updated=1");
    }
  };

  const getInputClass = (field: string) =>
    `border p-2 rounded-md ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

    // Loading state
    if (loading) {
      return (
        <Spinner/>
      );
    }

    // Not found
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
    <div className="py-10 px-12 font-inter">
      <Theme className="inline">
        <h1 className="text-2xl font-bold mb-4 font-inter">Update Showtime</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Link
            href="/manager/schedule"
            className="text-black hover:underline mb-4 flex gap-1 items-center font-inter"
          >
            <ArrowLeftIcon />
            Back
          </Link>

          <hr className="my-2 text-gray-300" />

          {errors.general && (
            <p className="text-red-500 font-inter mb-2">{errors.general}</p>
          )}

          <form
            className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-1">
              <label>
                Movie Name<span className="text-red-500">*</span>
              </label>
              <select
                className={getInputClass("movieID")}
                value={selectedMovie ?? ""}
                onChange={(e) => setSelectedMovie(parseInt(e.target.value))}
              >
                <option value="">Select a movie</option>
                {movies.map((movie) => (
                  <option key={movie.movie_id} value={movie.movie_id}>
                    {movie.movie_name}
                  </option>
                ))}
              </select>
              {errors.selectedMovie && (
                <p className="text-red-500 text-sm">{errors.selectedMovie}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label>
                Cinema Hall<span className="text-red-500">*</span>
              </label>
              <select
                className={getInputClass("hallID")}
                value={selectedHall ?? ""}
                onChange={(e) => setSelectedHall(parseInt(e.target.value))}
              >
                <option value="">Select a hall</option>
                {halls.map((hall) => (
                  <option key={hall.hall_id} value={hall.hall_id}>
                    {hall.hall_id === 9
                      ? `Hall ${hall.hall_id} (${hall.hall_type})`
                      : `Hall ${hall.hall_id}`}
                  </option>
                ))}
              </select>
              {errors.selectedHall && (
                <p className="text-red-500 text-sm">{errors.selectedHall}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label>
                Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={getInputClass("date")}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && (
                <p className="text-red-500 text-sm">{errors.date}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label>
                Time<span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                className={getInputClass("time")}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              {errors.time && (
                <p className="text-red-500 text-sm">{errors.time}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label>
                Status<span className="text-red-500">*</span>
              </label>
              <select
                className={getInputClass("status")}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Select status</option>
                <option value="Available">Available</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Sold Out">Sold Out</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm">{errors.status}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label>
                Adult Price (RM)<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                className={getInputClass("adultPrice")}
                value={adultPrice}
                onChange={(e) => setAdultPrice(parseFloat(e.target.value))}
              />
              {errors.adultPrice && (
                <p className="text-red-500 text-sm">{errors.adultPrice}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label>
                Senior Price (RM)<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                className={getInputClass("seniorPrice")}
                value={seniorPrice}
                onChange={(e) => setSeniorPrice(parseFloat(e.target.value))}
              />
              {errors.seniorPrice && (
                <p className="text-red-500 text-sm">{errors.seniorPrice}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label>
                Child Price (RM)<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                className={getInputClass("childPrice")}
                value={childPrice}
                onChange={(e) => setChildPrice(parseFloat(e.target.value))}
              />
              {errors.childPrice && (
                <p className="text-red-500 text-sm">{errors.childPrice}</p>
              )}
            </div>
            
            <div></div>

            <div className="flex justify-self-end items-end">
              <Button color="green" size="2" variant="solid" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Sp/>
                    Updating...
                  </>
                ) : (
                  <>
                    <ArchiveIcon />
                    Update Showtime
                  </>
                )}
                
              </Button>
            </div>
          </form>
        </div>
      </Theme>
    </div>
  );
}