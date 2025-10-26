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
    const [formError, setFormError] = useState(null as string | null);
    const [staffID, setStaffID] = useState(null);
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

        if (!movieName || !description || !year || !duration || !ageRating || !genre || !ticketPrice) {
            setFormError("*Please fill in all fields.");
            return;
        }

        const { data, error } = await supabase
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
            setFormError("*Error adding movie. Please try again.");
            console.error("Error adding movie:", error);
        } else {
            router.push('/manager/movies?success=1');
        }
    }

    return (
        <div className="py-10 px-12">
            <h1 className="text-2xl font-bold font-inter mb-4">Add Movie</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <a href="/manager/movies" className="text-black hover:underline mb-4 flex gap-1 items-center">
                    <ArrowLeftIcon/>
                    Back
                </a>
                <hr className="my-2 text-gray-300" />
                <Theme className="inline">
                    <p className="text-red-500 font-inter">{formError}</p>
                    <Form action="/manager/movies" className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-2">
                            <label>Movie Name</label>
                            <input 
                                type="text" 
                                name="name" 
                                className="border border-gray-300 p-2 rounded-md"
                                placeholder='Movie Name'
                                value={movieName} 
                                onChange={(e) => setMovieName(e.target.value)} 
                            />
                        </div>

                        <div className="flex flex-col gap-2 row-span-2">
                            <label>Movie Description</label>
                            <textarea 
                                name="description"
                                className="border border-gray-300 p-2 rounded-md w-full h-32" 
                                placeholder='Movie description'
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label>Year</label>
                            <input 
                                type="number" 
                                name="year" 
                                className="border border-gray-300 p-2 rounded-md"
                                placeholder='Eg: 2024'
                                value={year} 
                                onChange={(e) => setYear(e.target.value)} 
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label>Duration (in minutes)</label>
                            <input 
                                type="number" 
                                name="duration" 
                                className="border border-gray-300 p-2 rounded-md"
                                placeholder='Eg: 120'
                                value={duration} 
                                onChange={(e) => setDuration(e.target.value)} 
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label>Age Rating</label>
                            <select name="age_rating" className="border border-gray-300 p-2 rounded-md" value={ageRating} onChange={(e) => setAgeRating(e.target.value)}>
                                <option value="U">U</option>
                                <option value="P12">P12</option>
                                <option value="13">13</option>
                                <option value="16">16</option>
                                <option value="18">18</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label>Genre</label>
                            <input 
                                type="text" 
                                name="genre" 
                                className="border border-gray-300 p-2 rounded-md"
                                placeholder='Eg: Action, Comedy'
                                value={genre} 
                                onChange={(e) => setGenre(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label>Ticket Price</label>
                            <input 
                                type="number" 
                                name="ticket_price" 
                                className="border border-gray-300 p-2 rounded-md" 
                                placeholder='0.00' 
                                step="0.01" 
                                value={ticketPrice} 
                                onChange={(e) => setTicketPrice(e.target.value)} 
                            />
                        </div>

                        <div></div> {/* Empty div for grid alignment */}
                        <div className='justify-self-end'>
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
