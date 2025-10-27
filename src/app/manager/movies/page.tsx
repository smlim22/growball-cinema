'use client';
import { Theme, Button, Flex, Callout } from '@radix-ui/themes';
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { PlusIcon, CheckCircledIcon, EyeOpenIcon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";

type Movie = {
  movie_id: number;
  movie_name: string;
  year: number;
  duration: string;
  age_rating: string;
};

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const deleted = searchParams.get('deleted');

  function formatDuration(minutes: number | string) {
    const totalMinutes = typeof minutes === "string" ? parseInt(minutes, 10) : minutes;
    if (isNaN(totalMinutes)) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  useEffect(() => {
    const fetchMovies = async () => {
      const { data, error } = await supabase
        .from("movie")
        .select("*");

      if (error) {
        console.error("Error fetching movies:", error);
      } else {
        setMovies(data ?? []);
      }

      setLoading(false);
    };

    fetchMovies();
  }, []);

  return (
    <div className="py-10 px-12">
      <Theme className="inline">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-inter">Movies Management</h1>
          <Button color="green" size="2" variant="solid" type="submit" 
            onClick={() => {
              router.push('/manager/movies/add-movie');
            }}>
            <PlusIcon />
            Add Movie
          </Button>
        </div>
        {success && (
          <Callout.Root color="green" size="2" variant='soft' className="font-inter mb-4">
            <Callout.Icon>
              <CheckCircledIcon />
            </Callout.Icon>
            <Callout.Text>Movie added successfully!</Callout.Text>
          </Callout.Root>
        )}
        {deleted && (
          <Callout.Root color="red" size="2" variant="soft" className="font-inter mb-4">
            <Callout.Icon>
              <TrashIcon />
            </Callout.Icon>
            <Callout.Text>Movie deleted successfully.</Callout.Text>
          </Callout.Root>
        )}
      </Theme>

      {loading ? (
        <p>Loading movies...</p>
      ) : (
        <Theme className="inline">
          <table className="min-w-full bg-white shadow-md rounded-lg border-collapse border overflow-hidden font-inter">
            <thead className="bg-signature-red text-white">
              <tr>
                <th className="border border-signature-red py-3 px-6 text-left">No.</th>
                <th className="border border-signature-red py-3 px-6 text-left">Name</th>
                <th className="border border-signature-red py-3 px-6 text-left">Year</th>
                <th className="border border-signature-red py-3 px-6 text-left">Duration</th>
                <th className="border border-signature-red py-3 px-6 text-left">Age Rating</th>
                <th className="border border-signature-red py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.length > 0 ? (
                movies.map((movie, index) => (
                  <tr key={movie.movie_id || index} className="border-t border-gray-200">
                    <td className="py-3 px-6">{index + 1}</td>
                    <td className="py-3 px-6">{movie.movie_name}</td>
                    <td className="py-3 px-6">{movie.year}</td>
                    <td className="py-3 px-6">{formatDuration(movie.duration)}</td>
                    <td className="py-3 px-6">{movie.age_rating}</td>
                    <td className="py-3 px-6">
                      <Flex gap="2">
                        <Button
                          color="blue"
                          size="2"
                          variant="solid"
                          onClick={() => router.push(`/manager/movies/${movie.movie_id}`)}
                        >
                          <EyeOpenIcon />
                          View
                        </Button>
                        <Button
                          color="amber"
                          size="2"
                          variant="solid"
                        >
                          <Pencil2Icon />
                          Edit
                        </Button>
                      </Flex>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 px-6 text-center" colSpan={6}>
                    No movies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Theme>
      )}
    </div>
  );
}