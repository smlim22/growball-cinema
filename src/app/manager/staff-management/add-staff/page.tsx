'use client';
import { Theme, Button } from '@radix-ui/themes';
import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

export  default function AddStaffPage(){
    const [staffName, setStaffName] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [staffPhoneNo, setStaffPhoneNo] = useState('');
    const [staffRole, setStaffRole] = useState<number | null>(1);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};

        if (!staffName) newErrors.staffName = "*Required Field";
        if (!staffEmail) newErrors.staffEmail = "*Required Field";
        if (!staffPhoneNo) newErrors.staffPhoneNo= "*Required Field";
        if (!staffRole) newErrors.staffRole = "*Required Field";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        const { error } = await supabase.from("staff").insert([
            {
                staff_name: staffName,
                staff_email: staffEmail,
                staff_phoneNo: staffPhoneNo,
                staffRole: Number(staffRole)
            },
        ]);

        if (error){
            console.error("Error adding staff:", error);
            setErrors({ general: "*Error adding staff. Please try again." });
        } else {
            router.push("/manager/staff-management?success=1");
        }
    }

    const getInputClass = (field: string) =>
    `border p-2 rounded-md ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

    return (
        <div className="py-10 px-12">
            <Theme className='inline'>
                <h1 className="text-2xl font-bold font-inter mb-4">Add New Staff</h1>
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
                            <Button color="green" size="2" variant="solid" type="submit">
                                <PlusIcon/>
                                Add New Staff
                            </Button>
                        </div>
                    </form>
                </div>
            </Theme>
        </div>
    )
}