'use client';
import { Theme, Button, Callout } from '@radix-ui/themes';
import { PlusIcon, Pencil2Icon, CheckCircledIcon } from "@radix-ui/react-icons";
import { useEffect } from 'react';

export default function StaffManagementPage(){
    return (
        <div className="py-10 px-12">
            <Theme className="inline">
                <div className="flex items-center justify-between mb-4 font-inter">
                    <h1 className="text-2xl font-bold font-inter">Schedule</h1>
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

                    </tbody>
                </table>
            </Theme>
        </div>
    )
}