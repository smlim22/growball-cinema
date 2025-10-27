'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { Theme, Button, Callout } from "@radix-ui/themes";
import { ArrowLeftIcon, TrashIcon } from "@radix-ui/react-icons";

type Movie = {
  movie_id: number;
  movie_name: string;
  movie_desc?: string;
  year: number;
  duration: number;
  age_rating: string;
  genre?: string[];
  ticket_price?: number;
};

export default function MovieDetailsPage() {
  const params = useParams();
  const movieId = params['movie-id-details'];
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to format movie duration
  function formatDuration(minutes: number | string) {
    const totalMinutes = typeof minutes === "string" ? parseInt(minutes, 10) : minutes;
    if (isNaN(totalMinutes)) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  useEffect(() => {
    const fetchMovie = async () => {
      if (!movieId) {
        console.warn("No movie ID in params:", params);
        setLoading(false);
        return;
      }

      console.log("Fetching movie ID:", movieId);

      const { data, error } = await supabase
        .from("movie")
        .select("*")
        .eq("movie_id", Number(movieId))
        .single();

      if (error) {
        console.error("Error fetching movie:", error);
      } else {
        setMovie(data ?? null);
      }
      setLoading(false);
    };

    fetchMovie();
  }, [movieId]);

  // Loading state
  if (loading) return <p className="px-12 py-10">Loading...</p>;

  // Movie not found
  if (!movie) {
    return (
      <Callout.Root color="red" size="2" variant="soft" className="font-inter mx-12 my-10">
        <Callout.Text>Movie not found.</Callout.Text>
      </Callout.Root>
    );
  }

  // Movie found
  return (
    <div className="py-10 px-12 font-inter">
      <h1 className="text-2xl font-bold mb-4">Movie Details</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
        <a
          href="/manager/movies"
          className="text-black hover:underline flex gap-1 items-center"
          >
          <ArrowLeftIcon />
          Back
        </a>

        <hr className="my-2 text-gray-300" />

        <table className="min-w-full border border-collapse border-gray-200 rounded-md font-inter my-4">
          <tbody>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Name</td>
              <td className="border border-gray-200 py-3 px-4">{movie.movie_name}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Description</td>
              <td className="border border-gray-200 py-3 px-4">{movie.movie_desc || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Year</td>
              <td className="border border-gray-200 py-3 px-4">{movie.year}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Duration</td>
              <td className="border border-gray-200 py-3 px-4">{formatDuration(movie.duration)}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Age Rating</td>
              <td className="border border-gray-200 py-3 px-4">{movie.age_rating}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Genre</td>
              <td className="border border-gray-200 py-3 px-4">{movie.genre?.join(", ") || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Ticket Price</td>
              <td className="border border-gray-200 py-3 px-4">
                {movie.ticket_price ? `RM ${movie.ticket_price.toFixed(2)}` : "-"}
              </td>
            </tr>
          </tbody>
        </table>

        <Theme className="inline">
          <Button
            color="red"
            variant="solid"
            //   onClick={() => router.push(`/manager/movies/${movie.movie_id}/edit`)}
            >
            <TrashIcon />
            Delete Movie
          </Button>
        </Theme> 
      </div>
    </div>
  );
}
