'use client'
import { Theme, Button, Callout } from '@radix-ui/themes';
import { useState } from "react";

export default function FeedbackComplaintPage(){
    const [activeTab, setActiveTab] = useState<"feedback" | "complaint">("feedback");

    return (
        <div className="py-10 px-12">
            <Theme className='inline'>
                <h1 className="text-2xl font-bold font-inter">Feedback & Complaint Management</h1>
                <div className='flex flex-col bg-white shadow-sm rounded-lg p-4 my-4 font-inter gap-4'>
                    <div className='flex gap-2'>
                        <button 
                            onClick={() => setActiveTab("feedback")}
                            // className='bg-gray-200 font-semibold rounded-md p-2 hover:bg-signature-red hover:text-white'
                            className={`font-semibold rounded-md p-2 ${ 
                                activeTab === "feedback" ? "bg-signature-red text-white" : "bg-gray-200 hover:bg-signature-red hover:text-white" 
                            }`}
                        >
                            Feedback
                        </button>
                        <button
                            onClick={() => setActiveTab("complaint")}
                            className={`font-semibold rounded-md p-2 ${ 
                                activeTab === "complaint" ? "bg-signature-red text-white" : "bg-gray-200 hover:bg-signature-red hover:text-white" 
                            }`}
                        >
                            Complaint
                        </button>
                    </div>
                    {activeTab === "feedback" && (
                        <table className='border border-collapse rounded-lg overflow-hidden shadow-sm'>
                            <thead className="bg-signature-red text-white">
                                <tr>
                                    <th className="border border-signature-red py-3 px-6 text-left">No</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Name</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Ticket ID</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Rating</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Feedback</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className='border-t border-gray-200 hover:bg-gray-50'>
                                    <td className="py-3 px-6">1</td>
                                    <td className="py-3 px-6">Jean Paul</td>
                                    <td className="py-3 px-6">T001</td>
                                    <td className="py-3 px-6">3.0</td>
                                    <td className="py-3 px-6">The hall was dirty</td>
                                    <td className="py-3 px-6">
                                        <Button>
                                            Action
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}

                    {activeTab === "complaint" && (
                        <table className='border border-collapse rounded-lg overflow-hidden shadow-sm'>
                            <thead className="bg-signature-red text-white">
                                <tr>
                                    <th className="border border-signature-red py-3 px-6 text-left">No</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Title</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Type</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Date</th>
                                    <th className="border border-signature-red py-3 px-6 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className='border-t border-gray-200 hover:bg-gray-50'>
                                    <td className="py-3 px-6">1</td>
                                    <td className="py-3 px-6">The seat is broken</td>
                                    <td className="py-3 px-6">Facilites</td>
                                    <td className="py-3 px-6">24/12/2025</td>
                                    <td className="py-3 px-6">
                                        <Button>
                                            Action
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </Theme>
        </div>
    )
}