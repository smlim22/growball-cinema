'use client';
import { Theme, Button, Flex, Callout } from '@radix-ui/themes';
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { PlusIcon, CheckCircledIcon, EyeOpenIcon, Pencil2Icon, TrashIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";

type Movie = {
  movie_id: number;
  movie_name: string;
  year: number;
  duration: string;
  age_rating: string;
  genre?: string[];
};

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedAgeRating, setSelectedAgeRating] = useState("All");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const deleted = searchParams.get('deleted');
  const updateSuccess = searchParams.get('updateSuccess');

  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);
  const [uniqueAgeRatings, setUniqueAgeRatings] = useState<string[]>(["U", "P12", "13", "16", "18"]);

  function formatDuration(minutes: number | string) {
    const totalMinutes = typeof minutes === "string" ? parseInt(minutes, 10) : minutes;
    if (isNaN(totalMinutes)) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  // Pagination calculations
  const totalPages = Math.ceil(movies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShowtimes = movies.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Fetch movies
  useEffect(() => {
    const fetchMovies = async () => {
      const { data, error } = await supabase.from("movie").select("*").order("movie_name", {ascending: true});

      if (error) {
        console.error("Error fetching movies:", error);
      } else {
        setMovies(data ?? []);
        setFilteredMovies(data ?? []);

        const years = Array.from(new Set(data.map((m) => m.year))).sort((a, b) => b - a);
        const genres = Array.from(new Set(data.flatMap((m) => m.genre || []))).sort();

        setUniqueYears(years);
        setUniqueGenres(genres);
      }

      setLoading(false);
    };

    fetchMovies();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...movies];

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((m) =>
        m.movie_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedYear !== "All") {
      filtered = filtered.filter((m) => m.year === Number(selectedYear));
    }

    if (selectedGenre !== "All") {
      filtered = filtered.filter((m) => m.genre?.includes(selectedGenre));
    }

    if (selectedAgeRating !== "All") {
      filtered = filtered.filter((m) => m.age_rating === selectedAgeRating);
    }

    setFilteredMovies(filtered);
  }, [searchTerm, selectedYear, selectedGenre, selectedAgeRating, movies]);

  return (
    <div className="py-10 px-12 font-inter">
      <Theme className="inline">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-inter">Movies Management</h1>
          <Button
            color="green"
            size="2"
            variant="solid"
            type="submit"
            onClick={() => router.push('/manager/movies/add-movie')}
          >
            <PlusIcon />
            Add Movie
          </Button>
        </div>

        {/* Status Messages */}
        {success && (
          <Callout.Root color="green" size="2" variant="soft" className="mb-4">
            <Callout.Icon><CheckCircledIcon /></Callout.Icon>
            <Callout.Text className='font-inter'>Movie added successfully!</Callout.Text>
          </Callout.Root>
        )}
        {deleted && (
          <Callout.Root color="red" size="2" variant="soft" className="mb-4">
            <Callout.Icon><TrashIcon /></Callout.Icon>
            <Callout.Text className='font-inter'>Movie deleted successfully.</Callout.Text>
          </Callout.Root>
        )}
        {updateSuccess && (
          <Callout.Root color="green" size="2" variant="soft" className="mb-4">
            <Callout.Icon><CheckCircledIcon /></Callout.Icon>
            <Callout.Text className='font-inter'>Movie updated successfully!</Callout.Text>
          </Callout.Root>
        )}
      </Theme>

      {/* Search + Filters */}
      <Theme className='inline'>
        <div className="flex flex-wrap items-center bg-white shadow-sm rounded-lg p-4 mb-5 gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlassIcon className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search Movie Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-signature-red focus:outline-none"
            />
          </div>

          <select
            className="border border-gray-300 p-2 rounded-md"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="All">All Years</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            className="border border-gray-300 p-2 rounded-md"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="All">All Genres</option>
            {uniqueGenres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>

          <select
            className="border border-gray-300 p-2 rounded-md"
            value={selectedAgeRating}
            onChange={(e) => setSelectedAgeRating(e.target.value)}
          >
            <option value="All">All Ratings</option>
            {uniqueAgeRatings.map((rating) => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>

          <Button
            onClick={() => {
              setSearchTerm("");
              setSelectedYear("All");
              setSelectedGenre("All");
              setSelectedAgeRating("All");
            }}
            size="2"
            variant='soft'
            color='gray'
          >
            Clear Filters
          </Button>
        </div>
      </Theme>

      {/* Display Message if No Results Found for Selected Rating */}
      {selectedAgeRating !== "All" && !loading && filteredMovies.length === 0 && (
        <p className="text-red-600 font-medium mb-4">
          No results found for movies rated <span className="font-bold">{selectedAgeRating}</span>.
        </p>
      )}

      {/* Movies Table */}
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
                <th className="border border-signature-red py-3 px-6 text-left">Genre</th>
                <th className="border border-signature-red py-3 px-6 text-left">Age Rating</th>
                <th className="border border-signature-red py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.length > 0 ? (
                filteredMovies.map((movie, index) => (
                  <tr key={movie.movie_id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6">{index + 1}</td>
                    <td className="py-3 px-6">{movie.movie_name}</td>
                    <td className="py-3 px-6">{movie.year}</td>
                    <td className="py-3 px-6">{formatDuration(movie.duration)}</td>
                    <td className="py-3 px-6">{movie.genre?.join(", ") || "-"}</td>
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
                          onClick={() => router.push(`/manager/movies/update-movie/${movie.movie_id}`)}
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
                  <td className="py-3 px-6 text-center" colSpan={7}>
                    No movies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
        {movies.length > 0 && (
          <div className="flex items-center justify-between mt-4 font-inter">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, movies.length)} of {movies.length} movies
            </div>
            <div className="flex items-center gap-2">
              <Button
                color="gray"
                variant="soft"
                size="2"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <Button
                      key={page}
                      color={currentPage === page ? "blue" : "gray"}
                      variant={currentPage === page ? "solid" : "soft"}
                      size="2"
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </Button>
                  )
                ))}
              </div>
              
              <Button
                color="gray"
                variant="soft"
                size="2"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        )}
        </Theme>
      )}
    </div>
  );
}