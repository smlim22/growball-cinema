'use client';
import { Theme, Button, Callout } from '@radix-ui/themes';
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { PlusIcon, CheckCircledIcon, EyeOpenIcon, Pencil2Icon, TrashIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";

type Fnb = {
    fnb_id: number;
    fnb_name: string;
    fnb_desc: string;
    type: string;
    price: number;
}

export default function FnbPage(){
    const [fnbItems, setFnbItems] = useState<Fnb[]>([]);
    const [filteredFnbItems, setFilteredFnbItems] = useState<Fnb[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [availableTypes, setAvailableTypes] = useState<string[]>(["Food", "Beverages"]);

    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const router = useRouter();

    useEffect(() => {
        const fetchFnbItems = async () => {
            const { data, error } = await supabase
                .from("fnb")
                .select("*")
                .order("fnb_name", {ascending: true});
            
            if (error){
                console.error("Error fetching F&B Items:", error);
            } else{
                setFnbItems(data ?? []);
                setFilteredFnbItems(data ?? []);
            }
        }
        fetchFnbItems();
    }, [])

    useEffect(() => {
        let filtered = [...fnbItems];

        if(searchTerm.trim() !== ""){
            filtered = filtered.filter((f) =>
                f.fnb_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if(selectedType !== "All") {
            filtered = filtered.filter((f) => f.type === selectedType);
        }

        setFilteredFnbItems(filtered);
    }, [searchTerm, selectedType, fnbItems]);

    return(
        <div className="font-inter py-10 px-12">
            <Theme className='inline'>
                <div className='flex items-center justify-between mb-4'>
                    <h1 className='text-2xl font-bold font-inter'>F&B Management</h1>
                    <Button
                        color="green"
                        size="2"
                        variant='solid'
                        type="submit"
                        onClick={() => router.push('/manager/fnb/add-fnb-item')}
                    >
                        <PlusIcon/>
                        Add New Item
                    </Button>
                </div>

                {success && (
                    <Callout.Root color="green" size="2" variant="soft" className="mb-4">
                        <Callout.Icon><CheckCircledIcon /></Callout.Icon>
                        <Callout.Text>New F&B item added successfully!</Callout.Text>
                    </Callout.Root>
                )}

                <div className="flex flex-wrap items-center bg-white shadow-sm rounded-lg p-4 mb-5 gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                        <MagnifyingGlassIcon className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search F&B items"
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-signature-red focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="border border-gray-300 p-2 rounded-md" 
                        value={selectedType} 
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        {availableTypes.map((types) => (
                            <option key={types} value={types}>{types}</option>
                        ))}
                    </select>
                    <Button
                        color="gray"
                        size="2"
                        variant='soft'
                        onClick={() => {
                            setSearchTerm("");
                            setSelectedType("All");
                        }}
                    >
                        Clear Filter
                    </Button>
                </div>

                <table className="min-w-full bg-white shadow-md rounded-lg border-collapse border overflow-hidden font-inter">
                    <thead className="bg-signature-red text-white">
                        <tr>
                            <th className="border border-signature-red py-3 px-6 text-left">No.</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Name</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Description</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Type</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Price (RM)</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFnbItems.length > 0 ? (
                            filteredFnbItems.map((fnb, index) =>(
                                <tr key={fnb.fnb_id || index} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-6">{index + 1}</td>
                                    <td className="py-3 px-6">{fnb.fnb_name}</td>
                                    <td className="py-3 px-6">{fnb.fnb_desc}</td>
                                    <td className="py-3 px-6">{fnb.type}</td>
                                    <td className="py-3 px-6">{fnb.price.toFixed(2)}</td>
                                    <td className="py-3 px-6">
                                        <Button
                                            color="amber"
                                            size="2"
                                            variant='solid'
                                        >
                                            <Pencil2Icon/>
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="py-3 px-6 text-center" colSpan={6}>
                                    No items found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Theme>
        </div>
    );
}