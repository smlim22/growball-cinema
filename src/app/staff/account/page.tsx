'use client';
import { supabase } from "@/app/lib/supabaseClient";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Theme, Button } from "@radix-ui/themes";

type Staff = {
    staff_name: string,
    staff_phoneNo: string,
    staff_email: string,
    access_level: number
}

export default function AccountPage() {
    const [staffDetails, setStaffDetails] = useState<Staff>();
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;
            
            const { data, error } = await supabase
                .from("staff")
                .select("staff_name, staff_phoneNo, staff_email, access_level")
                .eq("uuid", user.id)
                .single();
            
            if(error){
                console.error("Error fetching staff details:", error)
            }else{
                setStaffDetails(data);
            }
        }
        checkAuth();
    })

    return (
        <div className="py-10 px-12 font-inter">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex flex-row">
                    <div className="py-2 px-4">
                        <p className="text-lg"><strong>{staffDetails?.staff_name}</strong></p>
                        <p className="text-base text-gray-500">{staffDetails?.staff_email}</p>
                    </div>
                    <div className="flex flex-col border-l border-gray-300 py-2 px-4 space-y-4">
                        <div className="flex flex-col space-y-2">
                            <p className="text-base"><strong>Phone Number:</strong> {staffDetails?.staff_phoneNo}</p>
                            <p className="text-base"><strong>Access Level:</strong> {staffDetails?.access_level === 1 ? "Staff" : staffDetails?.access_level === 2 ? "Manager" : "Unknown"}</p>
                        </div>
                        <div>
                            <p className="text-base"><strong>Password</strong></p>
                            <p className="text-base">Update your password</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}