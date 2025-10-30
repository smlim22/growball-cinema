"use client";
import { Theme, Button } from '@radix-ui/themes';
import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import Form from 'next/form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

export default function AddShowtimePage(){
    return(
        <div className="py-10 px-12">
            <Theme className="inline">
                <h1 className="text-2xl font-bold font-inter mb-4">Add Showtime</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <a href="/manager/schedule" className="text-black hover:underline mb-4 flex gap-1 items-center font-inter">
                        <ArrowLeftIcon />
                        Back
                    </a>
                    <hr className="my-2 text-gray-300" />
                    <Form action="/manager/schedule" className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter">
                        <div className='flex flex-col gap-1'>
                            <label>Movie Name<span className="text-red-500">*</span></label>
                            <select>
                                <option>Select A Movie</option>
                            </select>
                        </div>
                        <div className='flex flex-col gap-1'>
                            <label>Cinema Hall<span className="text-red-500">*</span></label>
                            <select>
                                <option>Cinema Hall</option>
                            </select>
                        </div>
                        <div className='flex flex-col gap-1'>
                            <label>Date<span className="text-red-500">*</span></label>
                            <input type="date"></input>
                        </div>
                        <div className='flex flex-col gap-1'>
                            <label>Time<span className="text-red-500">*</span></label>
                            <input type="time"></input>
                        </div>
                        
                        <div></div>

                        <div className="justify-self-end">
                            <Button color="green" size="2" variant="solid" type="submit">
                                <PlusIcon />
                                Add F&B Item
                            </Button>
                        </div>
                    </Form>
                </div>
            </Theme>
        </div>
    )
}