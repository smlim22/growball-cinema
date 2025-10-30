import { Theme, Button } from '@radix-ui/themes';
import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";

export default function AddShowtimePage(){
    return(
        <div className="py-10 px-12">
            <Theme className="inline">
                <h1 className="text-2xl font-bold font-inter mb-4">Add Showtime</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <a href="/manager/schedule" className="text-black hover:underline mb-4 flex gap-1 items-center">
                        <ArrowLeftIcon />
                        Back
                    </a>
                    <hr className="my-2 text-gray-300" />
                </div>
            </Theme>
        </div>
    )
}