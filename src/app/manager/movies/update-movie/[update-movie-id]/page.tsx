'use client';
import { Theme, Button, Callout } from '@radix-ui/themes';
import { PlusIcon, ArrowLeftIcon, ArchiveIcon } from "@radix-ui/react-icons";
import Form from 'next/form';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

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

export default function UpdateMoviePage(){
    const params = useParams();
    const movieId = params['update-movie-id'];
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const router = useRouter();

    const [movieName, setMovieName] = useState('');
    const [description, setDescription] = useState('');
    const [year, setYear] = useState('');
    const [duration, setDuration] = useState('');
    const [ageRating, setAgeRating] = useState('U');
    const [genre, setGenre] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');

    // Fetch movie details
    useEffect(() => {
        const fetchMovie = async () => {
            if (!movieId) {
                console.warn("No movie ID found in params:", params);
                setLoading(false);
                return;
            }

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
            setMovieName(data?.movie_name || '');
            setDescription(data?.movie_desc || '');
            setYear(data?.year.toString() || '');
            setDuration(data?.duration.toString() || '');
            setAgeRating(data?.age_rating || 'U');
            setGenre(data?.genre ? data.genre.join(', ') : '');
            setTicketPrice(data?.ticket_price ? data.ticket_price.toString() : '');
        };

        fetchMovie();
    }, [movieId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate inputs
        const newErrors: { [key: string]: string } = {};
        if (!movieName) newErrors.movieName = "Movie name is required.";
        if (!description) newErrors.description = "Description is required.";
        if (!year || isNaN(Number(year))) newErrors.year = "Valid year is required.";
        if (!duration || isNaN(Number(duration))) newErrors.duration = "Valid duration is required.";
        if (!ageRating) newErrors.ageRating = "Age rating is required.";
        if (!genre) newErrors.genre = "Genre is required.";
        if (!ticketPrice || isNaN(Number(ticketPrice))) newErrors.ticketPrice = "Valid ticket price is required.";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const { error } = await supabase
            .from("movie")
            .update({
                movie_name: movieName,
                movie_desc: description,
                year: parseInt(year, 10),
                duration: parseInt(duration, 10),
                age_rating: ageRating,
                genre: genre
                    .split(",")
                    .map(g => g.trim())
                    .filter(g => g.length > 0),
                ticket_price: parseFloat(ticketPrice)
            })
            .eq("movie_id", movieId);

        if (error) {
            console.error("Error updating movie:", error);
            setErrors({ general: "*Error updating movie. Please try again." });
        } else {
            router.push('/manager/movies?updateSuccess=1');
        }

    };

    if (loading) return <p className="px-12 py-10">Loading...</p>;

    // Movie not found
    if (!movie) {
        return (
            <Theme className="inline">
                <Callout.Root color="red" size="2" variant="soft" className="font-inter mx-12 my-10">
                    <Callout.Text>Movie not found.</Callout.Text>
                </Callout.Root>
            </Theme>

        );
    }

    const getInputClass = (field: string) =>
    `border p-2 rounded-md ${
        errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;


    return (
        <div className="py-10 px-12">
            <h1 className="text-2xl font-bold mb-4">Update Movie Details</h1>
            <div className='bg-white p-6 rounded-lg shadow-md'>
                <a href="/manager/movies" className="text-black hover:underline mb-4 flex gap-1 items-center">
                    <ArrowLeftIcon />
                    Back
                </a>
                <hr className="my-2 text-gray-300" />
                <Theme className="inline">
                    <Form action="/manager/movies" className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter" onSubmit={handleSubmit}>
                        {/* Movie Name */}
                        <div className="flex flex-col gap-1">
                            <label>
                                Movie Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className={getInputClass("movieName")}
                                placeholder="Movie Name"
                                value={movieName}
                                onChange={(e) => setMovieName(e.target.value)}
                            />
                            {errors.movieName && <p className="text-red-500 text-sm">{errors.movieName}</p>}
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1 row-span-2">
                            <label>
                                Movie Description<span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className={`${getInputClass("description")} h-32 text-justify`}
                                placeholder="Movie description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                        </div>

                        {/* Year */}
                        <div className="flex flex-col gap-1">
                            <label>
                                Year<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className={getInputClass("year")}
                                placeholder="Eg: 2024"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                            />
                            {errors.year && <p className="text-red-500 text-sm">{errors.year}</p>}
                        </div>

                        {/* Duration */}
                        <div className="flex flex-col gap-1">
                            <label>
                                Duration (in minutes)<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className={getInputClass("duration")}
                                placeholder="Eg: 120"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            />
                            {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
                        </div>

                        {/* Age Rating */}
                        <div className="flex flex-col gap-1">
                            <label>
                                Age Rating<span className="text-red-500">*</span>
                            </label>
                            <select
                                className={getInputClass("ageRating")}
                                value={ageRating}
                                onChange={(e) => setAgeRating(e.target.value)}
                            >
                                <option value="U">U</option>
                                <option value="P12">P12</option>
                                <option value="13">13</option>
                                <option value="16">16</option>
                                <option value="18">18</option>
                            </select>
                            {errors.ageRating && <p className="text-red-500 text-sm">{errors.ageRating}</p>}
                        </div>

                        {/* Genre */}
                        <div className="flex flex-col gap-1">
                            <label>
                                Genre<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className={getInputClass("genre")}
                                placeholder="Eg: Action, Comedy"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                            />
                            {errors.genre && <p className="text-red-500 text-sm">{errors.genre}</p>}
                        </div>

                        {/* Ticket Price */}
                        <div className="flex flex-col gap-1">
                            <label>
                                Ticket Price (RM)<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className={getInputClass("ticketPrice")}
                                placeholder="0.00"
                                step="0.01"
                                value={ticketPrice}
                                onChange={(e) => setTicketPrice(e.target.value)}
                            />
                            {errors.ticketPrice && <p className="text-red-500 text-sm">{errors.ticketPrice}</p>}
                        </div>

                        <div></div>
                        <div className="justify-self-end">
                            <Button color="green" size="2" variant="solid" type="submit">
                                <ArchiveIcon />
                                Update Movie Details
                            </Button>
                        </div>
                    </Form>
                </Theme>
            </div>
        </div>
    )
}