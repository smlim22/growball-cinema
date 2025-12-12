"use client";
import { Theme, Button } from '@radix-ui/themes';
import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import Form from 'next/form';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
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

export default function AddShowtimePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<number>();
  const [selectedHall, setSelectedHall] = useState<number>();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [adultPrice, setAdultPrice] = useState('0.00');
  const [childPrice, setChildPrice] = useState('0.00');
  const [seniorPrice, setSeniorPrice] = useState('0.00');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

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

  useEffect(() => {
    const fetchHalls = async () => {
      const { data, error } = await supabase.from("cinema_hall").select("*");
      if (error) console.error("Error fetching halls", error);
      else setHalls(data ?? []);
    };
    fetchHalls();
  }, []);

  function timeWithMalaysiaOffset(timeHHmm: string) {
    if (!timeHHmm) return null;
    const [hh, mm] = timeHHmm.split(":");
    return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00+08`;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!selectedMovie) newErrors.selectedMovie = "*Required field";
    if (!selectedHall) newErrors.selectedHall = "*Required field";
    if (!date) newErrors.date = "*Required field";
    if (!time) newErrors.time = "*Required field";
    if (!adultPrice || isNaN(parseFloat(adultPrice)) || parseFloat(adultPrice) == 0) newErrors.adultPrice = "*Invalid adult price";
    if (!childPrice || isNaN(parseFloat(childPrice)) || parseFloat(childPrice) == 0) newErrors.childPrice = "*Invalid child price";
    if (!seniorPrice || isNaN(parseFloat(seniorPrice)) || parseFloat(seniorPrice) == 0) newErrors.seniorPrice = "*Invalid senior price";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const malaysiaTime = timeWithMalaysiaOffset(time);
    if (!malaysiaTime) {
      setErrors({ general: "*Invalid time format" });
      return;
    }

    // Fetch the selected movie's duration
    const movie = movies.find((m) => m.movie_id === selectedMovie);
    if (!movie) {
      setErrors({ general: "*Invalid movie selection" });
      return;
    }

    // Calculate the start and end times for the new showtime
    const startTime = new Date(`${date}T${time}:00+08:00`);
    const endTime = new Date(startTime.getTime() + movie.duration * 60000); // movie duration
    const endWithBuffer = new Date(endTime.getTime() + 30 * 60000); // +30 mins buffer

    // Fetch all existing showtimes for that hall and date
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

    // Check for overlap
    const hasOverlap = existingShowtimes?.some((s) => {
      const existingStart = new Date(`${date}T${s.time}:00`);
      const existingEnd = new Date(
        existingStart.getTime() + s.movie.duration * 60000 + 30 * 60000
      ); // includes buffer
    //   console.log("Existing start", existingStart)
    //   console.log("Existing end", existingEnd)
    //   console.log("Selected Time", malaysiaTime)
      return startTime < existingEnd && endWithBuffer > existingStart;
    });

    if (hasOverlap) {
      setErrors({
        general:
          "*This showtime overlaps with another or violates the 30-minute buffer rule.",
      });
      return;
    }

    // Insert new showtime
    const { error } = await supabase.from("showtimes").insert([
      {
        movie_id: selectedMovie,
        date: date,
        time: malaysiaTime,
        hall_id: selectedHall,
        status: "Available",
        adult_price: parseFloat(adultPrice),
        child_price: parseFloat(childPrice),
        senior_price: parseFloat(seniorPrice),
      },
    ]);

    if (error) {
      console.error("Error adding showtime:", error);
      setErrors({ general: "*Error adding showtime. Please try again." });
    } else {
      router.push("/manager/schedule?success=1");
    }
  };

  const getInputClass = (field: string) =>
    `border p-2 rounded-md ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div className="py-10 px-12">
      <Theme className="inline">
        <h1 className="text-2xl font-bold font-inter mb-4">Add Showtime</h1>
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
            method='post'
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
                <option value="">Select a cinema hall</option>
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

            <div className='flex flex-col gap-1'>
              <label>Adult Price (RM)<span className="text-red-500">*</span></label>
              <input
                type="number"
                className={getInputClass("adultPrice")}
                value={adultPrice}
                onChange={(e) => setAdultPrice(e.target.value)}
                step="0.01"
                min="0"
              />
              {errors.adultPrice && (
                <p className="text-red-500 text-sm">{errors.adultPrice}</p>
              )}
            </div>

            <div className='flex flex-col gap-1'>
              <label>Child Price (RM)<span className="text-red-500">*</span></label>
              <input
                type="number"
                className={getInputClass("childPrice")}
                value={childPrice}
                onChange={(e) => setChildPrice(e.target.value)}
                step="0.01"
                min="0"
              />
              {errors.childPrice && (
                <p className="text-red-500 text-sm">{errors.childPrice}</p>
              )}
            </div>

            <div className='flex flex-col gap-1'>
              <label>Senior Price (RM)<span className="text-red-500">*</span></label>
              <input
                type="number"
                className={getInputClass("seniorPrice")}
                value={seniorPrice}
                onChange={(e) => setSeniorPrice(e.target.value)}
                step="0.01"
                min="0"
              />
              {errors.seniorPrice && (
                <p className="text-red-500 text-sm">{errors.seniorPrice}</p>
              )}
            </div>

            <div className="flex items-end justify-self-end">
              <Button color="green" size="2" variant="solid" type="submit">
                <PlusIcon />
                Add Showtime
              </Button>
            </div>
          </form>
        </div>
      </Theme>
    </div>
  );
}