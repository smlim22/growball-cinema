'use client';
import { Theme, Button, Callout, Flex } from '@radix-ui/themes';
import { PlusIcon, Pencil2Icon, EyeOpenIcon, CheckCircledIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from 'react';
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

type Staff = {
    staff_id: number,
    staff_name: string,
    staff_email: string,
    access_level: number,
    status: string
}

export default function StaffManagementPage(){
    const [staff, setStaff] = useState<Staff[]>([]);
    const router = useRouter();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const updated = searchParams.get('updated');

    const getRoleName = (level: number) => {
        switch (level) {
            case 1: return "Staff";
            case 2: return "Manager";
            default: return "Unknown";
        }
    };

    useEffect(() => {
        const fetchStaff = async () => {
            let query = supabase.from("staff").select("*").order("status", {ascending: true});

            if (searchQuery) {
                query = query.ilike('staff_name', `%${searchQuery}%`); // Case-insensitive search
            }

            if (selectedRole) {
                query = query.eq('access_level', selectedRole);
            }

            if (selectedStatus) {
                query = query.eq('status', selectedStatus);
            }

            const { data, error } = await query;

            if(error){
                console.error("Error fetching list of staff", error);
            }else{
                setStaff(data ?? []);
            }
        }

        fetchStaff();
    }, [searchQuery, selectedRole, selectedStatus])

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

                <div className="flex flex-wrap items-center bg-white shadow-sm rounded-lg p-4 mb-5 gap-3 font-inter">
                    <div className="relative flex w-lg">
                        <MagnifyingGlassIcon className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search Staff Name"
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-signature-red focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-row items-center gap-x-1">
                        <label>Role</label>
                        <select
                            className="border border-gray-300 p-2 rounded-md"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="2">Manager</option>
                            <option value="1">Staff</option>
                        </select>
                    </div>

                    <div className="flex flex-row items-center gap-x-1">
                        <label>Status</label>
                        <select
                            className="border border-gray-300 p-2 rounded-md"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="flex flex-row items-center gap-x-1">
                        <Button
                            size="2"
                            variant='soft'
                            color='gray'
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedRole('');
                                setSelectedStatus('');
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>

                <table className="min-w-full bg-white shadow-md rounded-lg border-collapse border overflow-hidden font-inter">
                    <thead className="bg-signature-red text-white">
                        <tr>
                            <th className="border border-signature-red py-3 px-6 text-left">No</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Name</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Email</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Access Level</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Status</th>
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
                                    <td className="py-3 px-6">{getRoleName(s.access_level)}</td>
                                    <td className="py-3 px-6">{s.status}</td>
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
                                <td className="py-3 px-6 text-center" colSpan={6}>
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