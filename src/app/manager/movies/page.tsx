'use client';
import { Theme, Button, Flex } from '@radix-ui/themes';
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";

type Movie = {
  id: string;
  movie_name: string;
  year: number;
  duration: string;
  age_rating: string;
};

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="text-2xl font-bold mb-4">Movies Management</h1>

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
                <tr key={movie.id || index} className="border-t border-gray-200">
                  <td className="py-3 px-6">{index + 1}</td>
                  <td className="py-3 px-6">{movie.movie_name}</td>
                  <td className="py-3 px-6">{movie.year}</td>
                  <td className="py-3 px-6">{movie.duration}</td>
                  <td className="py-3 px-6">{movie.age_rating}</td>
                  <td className="py-3 px-6">
                    <Flex gap="1">
                        <Button color="green" size="2" variant="solid">
                            View
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