'use client';
import { Theme, Button, Callout, Spinner } from '@radix-ui/themes';
import { ArrowLeftIcon, ArchiveIcon } from "@radix-ui/react-icons";
import { ChangeEvent, useEffect, useState } from 'react';
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
  image_url: string;
};

export default function UpdateMoviePage(){
    const params = useParams();
    const movieId = params['update-movie-id'];
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const router = useRouter();

    const [movieName, setMovieName] = useState('');
    const [description, setDescription] = useState('');
    const [year, setYear] = useState('');
    const [duration, setDuration] = useState('');
    const [ageRating, setAgeRating] = useState('U');
    const [genre, setGenre] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

    // Fetch movie details
    useEffect(() => {
        const fetchMovie = async () => {
            setFetching(true);
            if (!movieId) {
                console.warn("No movie ID found in params:", params);
                setFetching(false);
                return;
            }

            const { data, error } = await supabase
                .from("movie")
                .select("*")
                .eq("movie_id", Number(movieId))
                .single();

            if (error) {
                console.error("Error fetching movie:", error);
                setMovie(null);
            } else {
                setMovie(data ?? null);
            }
            setMovieName(data?.movie_name || '');
            setDescription(data?.movie_desc || '');
            setYear(data?.year.toString() || '');
            setDuration(data?.duration.toString() || '');
            setAgeRating(data?.age_rating || 'U');
            setGenre(data?.genre ? data.genre.join(', ') : '');
            if (data?.image_url) {
                let imageUrl = data.image_url;
                setExistingImageUrl(imageUrl);
                setImagePreview(imageUrl);
            }
            setFetching(false);
        };

        fetchMovie();
    }, [movieId]);

    // Clean up preview URL when component unmounts or image changes
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview !== existingImageUrl) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview, existingImageUrl]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setImage(file);
            
            // Create preview URL
            if (imagePreview && imagePreview !== existingImageUrl) {
                URL.revokeObjectURL(imagePreview);
            }
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const filePath = `${file.name}`

        const {error} = await supabase.storage.from("movie_image").upload(filePath, file, {upsert: true});

        if (error) {
            console.error("Error uploading image:", error.message);
            return null;
        }

        const {data} = await supabase.storage.from("movie_image").getPublicUrl(filePath);

        return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl: string | null = existingImageUrl;
        // Only upload if a new file was selected
        if (image instanceof File) {
            imageUrl = await uploadImage(image);
        }

        // Validate inputs
        const newErrors: { [key: string]: string } = {};
        if (!movieName) newErrors.movieName = "Movie name is required.";
        if (!description) newErrors.description = "Description is required.";
        if (!year || isNaN(Number(year))) newErrors.year = "Valid year is required.";
        if (!duration || isNaN(Number(duration))) newErrors.duration = "Valid duration is required.";
        if (!ageRating) newErrors.ageRating = "Age rating is required.";
        if (!genre) newErrors.genre = "Genre is required.";
        // if (!image) newErrors.image = "*Image required";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            setLoading(false)
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
                image_url: imageUrl
            })
            .eq("movie_id", movieId);

        if (error) {
            console.error("Error updating movie:", error);
            setErrors({ general: "*Error updating movie. Please try again." });
            setLoading(false);
        } else {
            router.push('/manager/movies?updateSuccess=1');
        }

    };

    // Show loading state while fetching
    if (fetching) {
        return (
            <div className="py-10 px-12">
                <Theme className="inline">
                    <div className="flex items-center justify-center">
                        <Spinner size="3" />
                    </div>
                </Theme>
            </div>
        );
    }

    // Movie not found
    if (!movie) {
        return (
            <Theme className="inline">
                <Callout.Root color="red" size="2" variant="soft" className="font-inter mx-12 my-10">
                    <Callout.Text className='font-inter'>Movie not found.</Callout.Text>
                </Callout.Root>
            </Theme>

        );
    }

    const getInputClass = (field: string) =>
        `border p-2 rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition ${
            errors[field] ? 'border-red-500 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-blue-400'
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
                    <form action="/manager/movies" className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter" onSubmit={handleSubmit}>
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

                        <div className="flex flex-col gap-1">
                            <label>Image<span className="text-red-500">*</span></label>
                            <input 
                                type="file"
                                accept='image/*'
                                onChange={handleFileChange}
                                className={`${getInputClass("image")} file:cursor-pointer file:bg-gray-300 file:text-gray-800 file:text-base hover:file:bg-gray-200 file:rounded-sm file:px-2 file:mr-3`}
                            />
                            {imagePreview && (
                                <div className="mt-2">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="max-w-xs max-h-64 rounded-md border border-gray-300 object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        <div></div>

                        <div className="flex items-end justify-self-end">
                            <Button color="green" size="2" variant="solid" type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner/>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <ArchiveIcon />
                                        Update Movie Details
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Theme>
            </div>
        </div>
    )
}