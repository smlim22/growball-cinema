'use client';
import { Theme, Button, Flex } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { EyeOpenIcon, Pencil2Icon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

type Order = {
    order_id: number;
    order_date: string;
    order_time: string;
    status: string;
}

export default function FNBStaffPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [selectedSort, setSelectedSort] = useState("Newest");

    // Format date (DD/MM/YYYY) and time (hh:mm AM/PM)
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB"); // 25/10/2025
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":");
        const date = new Date();
        date.setHours(Number(hours), Number(minutes));
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    useEffect(() => {
        const fetchOrders = async () => {

            let query = supabase
                .from('order')
                .select('*')

            if (selectedStatus !== "All") {
                 query = query.eq('status', selectedStatus);
            }

            if (selectedSort === "Newest") {
                query = query.order('order_date', { ascending: false });
            }

            if (selectedSort === "Oldest") {
                query = query.order('order_date', { ascending: true });
            }
            
            const { data, error } = await query;

            if (error) {
                console.error('Error fetching orders:', error);
            } else {
                setOrders(data ?? []);
            }
        }
        fetchOrders();
    }, [selectedStatus, selectedSort]);

    return (
        <div className="font-inter py-10 px-12">
            <h1 className="text-2xl font-bold mb-4">F&B Order Management</h1>
            <div className="flex flex-wrap items-center bg-white shadow-sm rounded-lg p-4 mb-5 gap-3 font-inter">
                <div className="flex flex-row items-center gap-x-1">
                    <label>Status</label>
                    <select className="border border-gray-300 p-2 rounded-md" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="flex flex-row items-center gap-x-1">
                    <label>Sort By</label>
                    <select className="border border-gray-300 p-2 rounded-md" value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                        <option value="Newest">Newest</option>
                        <option value="Oldest">Oldest</option>
                    </select>
                </div>
            </div>
            <Theme className='inline'>
                <table className="min-w-full bg-white shadow-md rounded-lg border-collapse border overflow-hidden font-inter">
                    <thead className="bg-signature-red text-white">
                        <tr>
                            <th className="border border-signature-red py-3 px-6 text-left">Order ID</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Date</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Time</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Status</th>
                            <th className="border border-signature-red py-3 px-6 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? (
                            orders.map((order) => (
                            <tr key={order.order_id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-6">{order.order_id}</td>
                                <td className="py-3 px-6">{formatDate(order.order_date)}</td>
                                <td className="py-3 px-6">{formatTime(order.order_time)}</td>
                                <td className="py-3 px-6">{order.status}</td>
                                <td className="py-3 px-6">
                                    <Flex gap="2">
                                        <Button color="blue" size="2" variant="solid" onClick={() => router.push(`/staff/fnb/order/${order.order_id}`)}>
                                            <EyeOpenIcon /> View
                                        </Button>
                                        <Button color="amber" size="2" variant="solid" onClick={() => router.push(`/staff/fnb/order/${order.order_id}`)}>
                                            <Pencil2Icon /> Update Status
                                        </Button>
                                    </Flex>
                                </td>
                            </tr>
                        ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-gray-500">
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Theme>
        </div>
    )
}