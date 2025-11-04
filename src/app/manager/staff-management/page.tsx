'use client';
import { Theme, Button, Callout, Flex } from '@radix-ui/themes';
import { PlusIcon, Pencil2Icon, EyeOpenIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from 'react';
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

type Staff = {
    staff_id: number,
    staff_name: string,
    staff_email: string,
    access_level: number,
}

export default function StaffManagementPage(){
    const [staff, setStaff] = useState<Staff[]>([]);
    const router = useRouter();

    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const updated = searchParams.get('updated');

    useEffect(() => {
        const fetchStaff = async () => {
            let query = supabase.from("staff").select("*");

            const { data, error } = await query;

            if(error){
                console.error("Error fetching list of staff", error);
            }else{
                setStaff(data ?? []);
            }
        }

        fetchStaff();
    })

    return (
        <div className="py-10 px-12">
            <Theme className="inline">
                <div className="flex items-center justify-between mb-4 font-inter">
                    <h1 className="text-2xl font-bold font-inter">Staff Management</h1>
                    <Button
                        color="green"
                        size="2"
                        variant="solid"
                        type="button"
                    >
                        <PlusIcon />
                        Add New Staff
                    </Button>
                </div>
                {success && (
                    <Callout.Root color="green" size="2" variant="soft" className="mb-4">
                        <Callout.Icon><CheckCircledIcon /></Callout.Icon>
                        <Callout.Text className='font-inter'>Showtime added successfully!</Callout.Text>
                    </Callout.Root>
                )}
        
                {updated && (
                    <Callout.Root color="green" size="2" variant="soft" className="mb-4">
                        <Callout.Icon><CheckCircledIcon /></Callout.Icon>
                        <Callout.Text className='font-inter'>Showtime updated!</Callout.Text>
                    </Callout.Root>
                )}
                <table className="min-w-full bg-white shadow-md rounded-lg border-collapse border overflow-hidden font-inter">
                    <thead className="bg-signature-red text-white">
                        <tr>
                            <th className="border border-signature-red py-3 px-6 text-left">No</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Name</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Email</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Access Level</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.length > 0 ? (
                            staff.map((s, index ) =>(
                                <tr key={s.staff_id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-6">{index+1}</td>
                                    <td className="py-3 px-6">{s.staff_name}</td>
                                    <td className="py-3 px-6">{s.staff_email}</td>
                                    <td className="py-3 px-6">{s.access_level === 1 ? `Staff` : s.access_level === 2 ? `Manager` : ``}</td>
                                    <td className="py-3 px-6">
                                        <Flex gap="2">
                                            <Button
                                                color="blue"
                                                size="2"
                                                variant="solid"
                                                onClick={() => router.push(`/manager/staff-management/${s.staff_id}`)}
                                            >
                                                <EyeOpenIcon />
                                                View
                                            </Button>
                                            <Button
                                                color="amber"
                                                size="2"
                                                variant="solid"
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
                                <td className="py-3 px-6 text-center" colSpan={5}>
                                    No staff found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Theme>
        </div>
    )
}