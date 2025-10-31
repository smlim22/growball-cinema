'use client';
import { Theme, Button, Callout, Spinner } from '@radix-ui/themes';
import { ArrowLeftIcon, ArchiveIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

export default function UpdateShowtimePage(){
    
    return (
        <div className='py-10 px-12 font-inter'>
            <Theme className='inline'>
                <h1 className='text-2xl font-bold mb-4'> Update Showtime</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <a href="/manager/schedule" className="text-black hover:underline mb-4 flex gap-1 items-center">
                        <ArrowLeftIcon />
                        Back
                    </a>

                    <hr className="my-2 text-gray-300" />

                    <form className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter" method='post'>
                        <div className="flex flex-col gap-1">
                            <label>Movie Name<span className="text-red-500">*</span></label>
                            <select>
                                <option>Movie</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label>Cinema Hall<span className="text-red-500">*</span></label>
                            <select>
                                <option>Hall</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label>Date<span className="text-red-500">*</span></label>
                            <input type="date"/>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label>Time<span className="text-red-500">*</span></label>
                            <input type="time"/>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label>Status<span className="text-red-500">*</span></label>
                            <select>
                                <option>Status</option>
                            </select>
                        </div>

                        <div className="flex justify-self-end items-end">
                        <Button color="green" size="2" variant="solid" type="submit">
                            <ArchiveIcon />
                            Add Showtime
                        </Button>
                        </div>
                    </form>

                </div>
            </Theme>
        </div>
    )
}