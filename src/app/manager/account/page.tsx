'use client';
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Theme, Button, Callout } from "@radix-ui/themes";
import { EyeOpenIcon, EyeClosedIcon, CheckCircledIcon } from "@radix-ui/react-icons";

type Staff = {
    staff_id: number,
    staff_name: string,
    staff_phoneNo: string,
    staff_email: string,
    access_level: number
}

export default function AccountPage() {
    const [staffDetails, setStaffDetails] = useState<Staff>();
    const [phoneNo, setPhoneNo] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordForm, setPasswordForm] = useState(false);
    const [phoneForm, setPhoneForm] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [oldErrorMessage, setOldErrorMessage] = useState('');
    const [newErrorMessage, setNewErrorMessage] = useState('');
    const [confirmErrorMessage, setConfirmErrorMessage] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;
            
            const { data, error } = await supabase
                .from("staff")
                .select("staff_id,staff_name, staff_phoneNo, staff_email, access_level")
                .eq("uuid", user.id)
                .single();
            
            if(error){
                console.error("Error fetching staff details:", error)
            }else{
                setStaffDetails(data);
                setPhoneNo(data.staff_phoneNo);
            }
        }
        checkAuth();
    }, []);

    const handlePhoneNoUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const res = await fetch('/api/staff/update-phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    staff_id: staffDetails?.staff_id,
                    staff_phoneNo: phoneNo
                })
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message);
            } else {
                setPhoneForm(false);
                const updatedStaffDetails = { ...staffDetails, staff_phoneNo: phoneNo } as Staff;
                setStaffDetails(updatedStaffDetails);
            }
        } catch (error) {
            console.error("Error updating phone number:", error);
        }
    }

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setOldErrorMessage('');
        setNewErrorMessage('');
        setConfirmErrorMessage('');

        if (oldPassword === '') {
            setOldErrorMessage('Please enter your old password');
        }

        if (newPassword === '') {
            setNewErrorMessage('Please enter your new password');
        }

        if (confirmPassword === '') {
            setConfirmErrorMessage('Please repeat your password');
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('New passwords do not match');
        }

        // get current user email/uuid
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (!user) {
            setErrorMessage('Not authenticated');
            return;
        }

        // Re-authenticate by signing in with current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email || '',
            password: oldPassword
        });

        if (signInError) {
            setOldErrorMessage('Old password is incorrect');
            return;
        }

        // Call server to perform admin password update
        const res = await fetch('/api/staff/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid: user.id, newPassword })
        });
        const result = await res.json();

        if (!result.success) {
            setErrorMessage(result.message || 'Failed to update password');
            return;
        }

        setSuccess(true);

        setPasswordForm(false);
    };

    return (
        <div className="py-10 px-12 font-inter">
            <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
            <Theme className="inline">
                {success && (
                    <Callout.Root color="green" size="2" variant="soft" className="mb-4">
                        <Callout.Icon><CheckCircledIcon /></Callout.Icon>
                        <Callout.Text className='font-inter'>Password updated successfully!</Callout.Text>
                    </Callout.Root>
                )}
                <div className="bg-white shadow-md rounded-lg p-6 flex flex-col gap-6 font-inter">
                    <div className="">
                        <p className="text-lg"><strong>{staffDetails?.staff_name}</strong></p>
                        <p className="text-base text-gray-500">{staffDetails?.staff_email}</p>
                    </div>

                    <hr className="border-t border-gray-300" />

                    <div className="grid grid-cols-2">
                        <div className="flex flex-col self-center">
                            <p className="text-base"><strong>Phone Number:</strong> {staffDetails?.staff_phoneNo}</p>
                            <p className="text-sm">Your phone number</p>
                        </div>
                        {!phoneForm ? (
                            <div className="flex justify-end items-center">
                                <Button color="blue" variant="solid" className="cursor-pointer" onClick={() => setPhoneForm(true)}>
                                    Edit Phone Number
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-end items-center">
                                <form className="flex flex-col gap-2">
                                    <label className="font-semibold">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="border border-gray-300 rounded px-2 py-1" 
                                        value={phoneNo} 
                                        onChange={(e) => setPhoneNo(e.target.value)} 
                                    />
                                    <Button color="green" variant="solid" className="cursor-pointer" onClick={handlePhoneNoUpdate}>
                                        Save
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                    
                    <hr className="border-t border-gray-300" />

                    <div className="grid grid-cols-2">
                        <div className="flex flex-col self-center">
                            <p className="text-base"><strong>Password</strong></p>
                            <p className="text-sm">Update your password</p>
                        </div>
                        {!passwordForm ? (
                            <div className="flex justify-end items-center">
                                <Button color="blue" variant="solid" className="cursor-pointer" onClick={() => setPasswordForm(true)}>
                                    Update Password
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-end items-center">
                                <form className="flex flex-col gap-2 w-full" onSubmit={handlePasswordUpdate}>
                                    <label className="font-semibold">Current Password</label>
                                    <div className="flex items-center border border-gray-300 rounded px-2 py-1 gap-2">
                                       <input 
                                           type={showOldPassword ? "text" : "password"} 
                                           className="flex-1 outline-none"
                                           value={oldPassword} 
                                           onChange={(e) => setOldPassword(e.target.value)} 
                                       />
                                       <button 
                                           type="button" 
                                           onClick={() => setShowOldPassword(!showOldPassword)}
                                           className="text-gray-600 hover:text-gray-900"
                                       >
                                           {showOldPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                       </button>
                                    </div>
                                    {oldErrorMessage && <p className="text-red-600 text-sm">{oldErrorMessage}</p>}

                                    <label className="font-semibold">New Password</label>
                                    <div className="flex items-center border border-gray-300 rounded px-2 py-1 gap-2">
                                       <input 
                                           type={showNewPassword ? "text" : "password"} 
                                           className="flex-1 outline-none"
                                           value={newPassword} 
                                           onChange={(e) => setNewPassword(e.target.value)} 
                                       />
                                       <button 
                                           type="button" 
                                           onClick={() => setShowNewPassword(!showNewPassword)}
                                           className="text-gray-600 hover:text-gray-900"
                                       >
                                           {showNewPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                       </button>
                                    </div>
                                    {newErrorMessage && <p className="text-red-600 text-sm">{newErrorMessage}</p>}

                                    <label className="font-semibold">Confirm New Password</label>
                                    <div className="flex items-center border border-gray-300 rounded px-2 py-1 gap-2">
                                       <input 
                                           type={showConfirmPassword ? "text" : "password"} 
                                           className="flex-1 outline-none"
                                           value={confirmPassword} 
                                           onChange={(e) => setConfirmPassword(e.target.value)} 
                                       />
                                       <button 
                                           type="button" 
                                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                           className="text-gray-600 hover:text-gray-900"
                                       >
                                           {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                       </button>
                                    </div>
                                    {confirmErrorMessage && <p className="text-red-600 text-sm">{confirmErrorMessage}</p>}

                                    {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}

                                    <div className="flex gap-2 mt-2">
                                        <Button type="button" variant="soft" color="blue" onClick={() => setPasswordForm(false)}>Cancel</Button>
                                        <Button type="submit" color="green">Save</Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </Theme>
        </div>
    )
}