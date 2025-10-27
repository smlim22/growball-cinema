'use client';
import { Theme, Button } from '@radix-ui/themes';
import Form from 'next/form';
import { PlusIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

export default function AddMoviePage() {
    const [movieName, setMovieName] = useState('');
    const [description, setDescription] = useState('');
    const [year, setYear] = useState('');
    const [duration, setDuration] = useState('');
    const [ageRating, setAgeRating] = useState('U');
    const [genre, setGenre] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [staffID, setStaffID] = useState<number | null>(null);

    // Track which fields are invalid
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const router = useRouter();

    useEffect(() => {
        const getStaffID = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data } = await supabase.from("staff").select("staff_id").eq("uuid", user?.id).single();
            setStaffID(data?.staff_id ?? null);
        };
        getStaffID();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};

        if (!movieName) newErrors.movieName = "*Required field";
        if (!description) newErrors.description = "*Required field";
        if (!year) newErrors.year = "*Required field";
        if (!duration) newErrors.duration = "*Required field";
        if (!ageRating) newErrors.ageRating = "*Required field";
        if (!genre) newErrors.genre = "*Required field";
        if (!ticketPrice) newErrors.ticketPrice = "*Required field";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        const { error } = await supabase
            .from('movie')
            .insert([
                {
                    movie_name: movieName,
                    movie_desc: description,
                    year: parseInt(year, 10),
                    duration: parseInt(duration, 10),
                    age_rating: ageRating,
                    genre: [genre],
                    ticket_price: parseFloat(ticketPrice),
                    added_by: staffID
                }
            ]);

        if (error) {
            console.error("Error adding movie:", error);
            setErrors({ general: "*Error adding movie. Please try again." });
        } else {
            router.push('/manager/movies?success=1');
        }
    };

    const getInputClass = (field: string) =>
        `border p-2 rounded-md ${
            errors[field] ? 'border-red-500' : 'border-gray-300'
        }`;

    return (
        <div className="py-10 px-12">
            <h1 className="text-2xl font-bold font-inter mb-4">Add Movie</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <a href="/manager/movies" className="text-black hover:underline mb-4 flex gap-1 items-center">
                    <ArrowLeftIcon />
                    Back
                </a>
                <hr className="my-2 text-gray-300" />

                <Theme className="inline">
                    {errors.general && (
                        <p className="text-red-500 font-inter mb-2">{errors.general}</p>
                    )}

                    <Form
                        action="/manager/movies"
                        className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter"
                        onSubmit={handleSubmit}
                    >
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
                                Ticket Price<span className="text-red-500">*</span>
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
                                <PlusIcon />
                                Add Movie
                            </Button>
                        </div>
                    </Form>
                </Theme>
            </div>
        </div>
    );
}
