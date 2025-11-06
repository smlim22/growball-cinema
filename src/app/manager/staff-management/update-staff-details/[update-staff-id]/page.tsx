'use client';
import { Theme, Button, Spinner, Callout } from '@radix-ui/themes';
import { ArrowLeftIcon, ArchiveIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { UUID } from 'crypto';
import { NextResponse } from 'next/server';

type Staff = {
    staff_id: number,
    staff_name: string,
    staff_email: string,
    staff_phoneNo: string,
    access_level: number,
    status: string,
    uuid: UUID,
}

export default function UpdateStaffPage(){
    const params = useParams();
    const staffId = params['update-staff-id'];
    const [staffDetails, setStaffDetails] = useState<Staff | null>(null)
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const router = useRouter();

    const [staffName, setStaffName] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [staffPhoneNo, setStaffPhoneNo] = useState('');
    const [staffRole, setStaffRole] = useState<number | null>(null);
    const [uuid, setUUID] = useState(null)

    useEffect(() => {
        const fetchStaff = async () => {
            const {data, error} = await supabase
                .from("staff")
                .select("*")
                .eq("staff_id", Number(staffId))
                .single();
            
            if(error){
                console.error("Error fetching staff details", error);
            }else{
                setStaffDetails(data ?? null)
            }
            setLoading(false);
            setStaffName(data?.staff_name || '');
            setStaffEmail(data?.staff_email || '');
            setStaffPhoneNo(data?.staff_phoneNo || '');
            setStaffRole(data?.access_level);
            setUUID(data?.uuid);
        };
        fetchStaff();
    }, [staffId])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const newErrors: { [key: string]: string } = {};

        if (!staffName) newErrors.staffName = "*Required Field";
        if (!staffEmail) newErrors.staffEmail = "*Required Field";
        if (!staffPhoneNo) newErrors.staffPhoneNo = "*Required Field";
        if (!staffRole) newErrors.staffRole = "*Required Field";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/staff/update-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    staff_id: Number(staffId),
                    staff_name: staffName,
                    staff_email: staffEmail,
                    staff_phoneNo: staffPhoneNo,
                    access_level: Number(staffRole),
                    uuid: uuid
                }),
            });

            const data = await res.json();

            if (!data.success) {
                console.error("Error updating staff:", data.error);
                setErrors({ general: "*Error updating staff. Please try again." });
            } else {
                router.push("/manager/staff-management?success=1");
            }

        } catch (err) {
            console.error("Unexpected error:", err);
            setErrors({ general: "*Unexpected error occurred." });
        } finally {
            setLoading(false);
        }
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

    const getInputClass = (field: string) =>
    `border p-2 rounded-md ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

    return (
        <div className="py-10 px-12">
            <Theme className='inline'>
                <h1 className="text-2xl font-bold font-inter mb-4">Update Staff Details</h1>
                <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
                    <a
                        href="/manager/staff-management"
                        className="text-black hover:underline flex gap-1 items-center font-inter"
                        >
                        <ArrowLeftIcon />
                        Back
                    </a>

                    <hr className="my-2 text-gray-300" />

                    <form className="grid grid-cols-2 space-y-4 gap-4 mt-6 font-inter" method="post" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-1">
                            <label>
                                Staff Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                className={getInputClass("staffName")}
                                type="text"
                                placeholder='Staff Name'
                                value={staffName}
                                onChange={(e) => setStaffName(e.target.value)}
                            />
                            {errors.staffName && (
                                <p className="text-red-500 text-sm">{errors.staffName}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label>
                                Staff Email Address<span className="text-red-500">*</span>
                            </label>
                            <input 
                                className={getInputClass("staffEmail")}
                                type="text"
                                placeholder='staffname@gmail.com'
                                value={staffEmail}
                                onChange={(e) => setStaffEmail(e.target.value)}
                            />
                            {errors.staffEmail && (
                                <p className="text-red-500 text-sm">{errors.staffEmail}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label>
                                Phone Number<span className="text-red-500">*</span>
                            </label>
                            <input 
                                className={getInputClass("staffPhoneNo")}
                                type="text" 
                                placeholder='Eg: 01234567890'
                                value={staffPhoneNo}
                                onChange={(e) => setStaffPhoneNo(e.target.value)}
                            />
                            {errors.staffPhoneNo && (
                                <p className="text-red-500 text-sm">{errors.staffPhoneNo}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label>
                                Role<span className="text-red-500">*</span>
                            </label>
                            <select value={staffRole ?? ""} onChange={(e) => setStaffRole(parseInt(e.target.value))} className={getInputClass("staffRole")}>
                                <option value="1">Staff</option>
                                <option value="2">Manager</option>
                            </select>
                            {errors.staffRole && (
                                <p className="text-red-500 text-sm">{errors.staffRole}</p>
                            )}
                        </div>

                        <div></div>

                        <div className="justify-self-end">
                            <Button
                                color="green"
                                size="2"
                                variant="solid"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                <>
                                    <Spinner /> <span className="ml-2">Adding...</span>
                                </>
                                ) : (
                                <>
                                    <ArchiveIcon />
                                    Add New Staff
                                </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </Theme>
        </div>
    )
}