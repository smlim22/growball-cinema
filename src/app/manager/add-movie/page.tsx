import { Theme, Button } from '@radix-ui/themes';
import Form from 'next/form';
import { PlusIcon } from "@radix-ui/react-icons";

export default function AddMoviePage() {
    return (
        <div className="py-10 px-12">
            <h1 className="text-2xl font-bold font-inter">Add Movie</h1>
            <div className="mt-4 bg-white p-6 rounded-lg shadow-md font-inter"> 
                <Form action="./movies" className="grid grid-cols-2 mt-6 space-y-4">
                    <label>Movie Name:</label>
                    <input type="text" name="name" className="border border-gray-300 p-2 rounded-md" />

                    <label>Movie Description</label>
                    <textarea name="description" className="border border-gray-300 p-2 rounded-md w-full h-32"></textarea>

                    <label>Year:</label>
                    <input type="number" name="year" className="border border-gray-300 p-2 rounded-md" />

                    <label>Duration (in minutes):</label>
                    <input type="number" name="duration" className="border border-gray-300 p-2 rounded-md" />

                    <label>Age Rating:</label>
                    <select name="age_rating" className="border border-gray-300 p-2 rounded-md">
                        <option value="G">U</option>
                        <option value="P12">P12</option>
                        <option value="13">13</option>
                        <option value="16">16</option>
                        <option value="18">18</option>
                    </select>

                    <label>Genre:</label>
                    <input type="text" name="genre" className="border border-gray-300 p-2 rounded-md" />

                    <label>Ticket Price:</label>
                    <input type="number" name="ticket_price" className="border border-gray-300 p-2 rounded-md" step="0.01" />

                    <Theme>
                        <Button color="green" size="2" variant="solid" type="submit">
                            <PlusIcon />
                            Add Movie
                        </Button>
                    </Theme>
                </Form>
            </div>
        </div>
    );
}
