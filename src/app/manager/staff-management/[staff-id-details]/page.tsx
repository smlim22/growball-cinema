'use client';
import { Theme, Button, Callout, Flex, Spinner } from '@radix-ui/themes';
import { PlusIcon, Pencil2Icon, EyeOpenIcon, CheckCircledIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from 'react';
import { supabase } from "@/app/lib/supabaseClient";
import { useParams } from "next/navigation";

type Staff = {
    staff_id: number,
    staff_name: string,
    staff_email: string,
    staff_phoneNo: string,
    access_level: number,
    joined_at: string,
    status: string
}

export default function StaffDetailsPage() {
    const params = useParams();
    const staffId = params['staff-id-details'];
    const [staffDetails, setStaffDetails] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentStatus, setCurrentStatus] = useState('');

    useEffect(() => {
        const fetchStaffDetails = async () => {
            if (!staffId) {
                console.warn("No Staff ID found in params:", params);
                setLoading(false);
                return;
            }

            setLoading(true);

            const { data, error } = await supabase
                .from("staff")
                .select("*")
                .eq("staff_id", Number(staffId))
                .single();

            if (error) {
                console.error("Error fetching staff details:", error);
            } else {
                setStaffDetails(data ?? null);
                setCurrentStatus(data?.status);
            }

            setLoading(false);
        };

        fetchStaffDetails();
    }, [staffId]);

    const alternateStatus = (status: string) => {
        if (status === "Active"){
            return "Inactive";
        } else {
            return "Active"
        }
    }

    const updateStatus = async () => {
        const newStatus = alternateStatus(currentStatus);

        const { error } = await supabase
            .from("staff")
            .update({
                status: newStatus
            })
            .eq("staff_id", Number(staffId));
        
        if (error){
            console.error("Error updating status", error);
        } else {
            setCurrentStatus(newStatus);
            setStaffDetails(prev => prev ? { ...prev, status: newStatus } : prev);
        }
    }

    if (loading) {
        return (
            <div className="py-10 px-12 flex flex-col items-center justify-center h-96">
                <Spinner size="3" />
                <p className="mt-3 text-gray-600 font-inter">Loading staff details...</p>
            </div>
        );
    }

    if (!staffDetails) {
        return (
            <Theme className="inline">
                <Callout.Root color="red" size="2" variant="soft" className="font-inter mx-12 my-10">
                    <Callout.Text className='font-inter'>Staff not found.</Callout.Text>
                </Callout.Root>
            </Theme>
        );
    }

    return (
        <div className="py-10 px-12">
            <Theme className='inline'>
                <h1 className="text-2xl font-bold mb-4 font-inter">Staff Details</h1>
                <Callout.Root color="gray" size="2" className="mb-5 font-inter">
                    <Callout.Text>
                        View and manage the details of a staff member. You can enable or disable their account below.
                    </Callout.Text>
                </Callout.Root>
                <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
                    <a
                        href="/manager/staff-management"
                        className="text-black hover:underline flex gap-1 items-center font-inter"
                    >
                        <ArrowLeftIcon />
                        Back
                    </a>

                    <hr className="my-2 text-gray-300" />

                    <table className="min-w-full border border-collapse border-gray-200 rounded-md font-inter my-4">
                        <tbody>
                            <tr>
                                <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50 w-1/3">Staff Name</td>
                                <td className="border border-gray-200 py-3 px-4">{staffDetails.staff_name}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Email Address</td>
                                <td className="border border-gray-200 py-3 px-4">{staffDetails.staff_email}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Phone No</td>
                                <td className="border border-gray-200 py-3 px-4">{staffDetails.staff_phoneNo}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Role</td>
                                <td className="border border-gray-200 py-3 px-4">
                                    {staffDetails.access_level === 1
                                        ? `Staff`
                                        : staffDetails.access_level === 2
                                        ? `Manager`
                                        : ``}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Joined On</td>
                                <td className="border border-gray-200 py-3 px-4">{staffDetails.joined_at}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-200 py-3 px-4 font-medium bg-gray-50">Status</td>
                                <td className="border border-gray-200 py-3 px-4">{staffDetails.status}</td>
                            </tr>
                        </tbody>
                    </table>

                    <Button size="2" color={currentStatus === "Active" ? "red" : "green"} onClick={updateStatus}>
                        {currentStatus === "Active" ? "Disable" : "Enable"}
                    </Button>
                </div>
            </Theme>
        </div>
    );
}