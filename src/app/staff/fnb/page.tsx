'use client';
import { Theme, Button, Flex, Callout } from '@radix-ui/themes';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { EyeOpenIcon, CheckCircledIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import ViewOrderDialog from '@/app/components/ViewOrderDialog';
import Spinner from '@/app/components/Spinner';
//import UpdateOrderDialog from '@/app/components/UpdateOrderDialog';

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
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
    //const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showFailMessage, setShowFailMessage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;


    // Format date (DD/MM/YYYY) and time (hh:mm AM/PM)
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB"); // 25/10/2025
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":");
        // Create a date object in UTC with today's date
        const date = new Date();
        date.setUTCHours(Number(hours), Number(minutes || 0), 0, 0);
        // Format in Asia/Kuala_Lumpur timezone
        return date.toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit", 
            hour12: true,
            timeZone: "Asia/Kuala_Lumpur"
        });
    };

    const fetchOrders = useCallback(async () => {
        let query = supabase
            .from('order')
            .select('*')

        if (selectedStatus !== "All") {
             query = query.eq('status', selectedStatus);
        }

        if (selectedSort === "Newest") {
            query = query.order('order_date', { ascending: false })
                        .order('order_time', { ascending: false });
        }

        if (selectedSort === "Oldest") {
            query = query.order('order_date', { ascending: true })
                        .order('order_time', { ascending: true });
        }
        
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to fetch orders');
        } else {
            setOrders(data ?? []);
        }
        setLoading(false);
    }, [selectedStatus, selectedSort]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatus, selectedSort]);

    // Pagination logic
    const totalPages = Math.ceil(orders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentOrders = orders.slice(startIndex, endIndex);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show first page
            pages.push(1);
            
            if (currentPage > 3) {
                pages.push('...');
            }
            
            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            
            // Show last page
            pages.push(totalPages);
        }
        
        return pages;
    };

    // const handleUpdateSuccess = useCallback(() => {
    //     fetchOrders();
    //     setShowSuccessMessage(true);
    //     // Auto-hide success message after 5 seconds
    //     setTimeout(() => {
    //         setShowSuccessMessage(false);
    //     }, 5000);
    // }, [fetchOrders]);

    const handleUpdateSuccess = () => {
        fetchOrders();
        setShowSuccessMessage(true);
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            setShowSuccessMessage(false);
        }, 5000);
    }

    const handleUpdateFailed = () => {
        fetchOrders();
        setShowFailMessage(true);
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            setShowFailMessage(false);
        }, 5000);
    }

    const handleUpdate = async (currentStatus: string, orderId: number) => {
        let newStatus = "";

        if (currentStatus == "Pending") {
            newStatus = "Ready For Pickup"
        } else if (currentStatus == "Ready For Pickup") {
            newStatus = "Completed"
        } else {
            handleUpdateFailed();
            return;
        }

        const { error } = await supabase
            .from("order")
            .update({
                status: newStatus
            })
            .eq("order_id", orderId);
        
        if (error){
            console.error("Error updating status:", error);
            handleUpdateFailed();
        } else {
            handleUpdateSuccess();
        }
    }

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="font-inter py-10 px-12">
            <h1 className="text-2xl font-bold mb-4">F&B Order Management</h1>
            {showSuccessMessage && (
                <Theme className="inline">
                    <Callout.Root color="green" size="2" variant="soft" className="mb-4 font-inter">
                        <Callout.Icon>
                            <CheckCircledIcon />
                        </Callout.Icon>
                        <Callout.Text className="font-inter">
                            Order status has been updated successfully!
                        </Callout.Text>
                    </Callout.Root>
                </Theme>
            )}
            {showFailMessage && (
                <Theme className="inline">
                    <Callout.Root color="red" size="2" variant="soft" className="mb-4 font-inter">
                        <Callout.Icon>
                            <CheckCircledIcon />
                        </Callout.Icon>
                        <Callout.Text className="font-inter">
                            Order status update failed!
                        </Callout.Text>
                    </Callout.Root>
                </Theme>
            )}
            <div className="flex flex-wrap items-center bg-white shadow-sm rounded-lg p-4 mb-5 gap-3 font-inter">
                <div className="flex flex-row items-center gap-x-1">
                    <label>Status</label>
                    <select className="border border-gray-300 p-2 rounded-md" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Ready For Pickup">Ready For Pickup</option>
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
                        {currentOrders.length > 0 ? (
                            currentOrders.map((order) => (
                            <tr key={order.order_id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-6">{order.order_id}</td>
                                <td className="py-3 px-6">{formatDate(order.order_date)}</td>
                                <td className="py-3 px-6">{formatTime(order.order_time)}</td>
                                <td className="py-3 px-6">
                                <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                                    order.status === "Completed" 
                                        ? "bg-green-100 text-green-800" 
                                        : order.status === "Pending"
                                        ? "bg-blue-100 text-blue-800"
                                        : order.status === "Ready For Pickup"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}>
                                    {order.status}
                                </span>
                                </td>
                                <td className="py-3 px-6">
                                    <Flex gap="2">
                                        <Button 
                                            color="blue" 
                                            size="2" 
                                            variant="solid" 
                                            onClick={() => {setSelectedOrder(order.order_id); setShowViewDialog(true);}}
                                        >
                                            <EyeOpenIcon /> View
                                        </Button>
                                        {/* <Button 
                                            color="amber" 
                                            size="2" variant="solid" 
                                            onClick={() => {setSelectedOrder(order.order_id); setShowUpdateDialog(true);}}
                                            disabled={order.status !== "Completed" ? false : true }
                                        >
                                            <Pencil2Icon /> Update Status
                                        </Button> */}
                                        <Button
                                            color={order.status == "Pending" ? "amber" : "green"}
                                            variant="solid"
                                            disabled={order.status == "Cancelled" || order.status == "Completed"}
                                            onClick={() => handleUpdate(order.status, order.order_id)}
                                        >
                                            {order.status == "Pending" ? "Allow For Pickup" : "Complete" }
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

                {/* Pagination Controls */}
                {orders.length > 0 && (
                    <div className="flex items-center justify-between mt-4 font-inter">
                        <div className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                color="gray"
                                variant="soft"
                                size="2"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeftIcon />
                                Previous
                            </Button>
                            
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                                    ) : (
                                        <Button
                                            key={page}
                                            color={currentPage === page ? "blue" : "gray"}
                                            variant={currentPage === page ? "solid" : "soft"}
                                            size="2"
                                            onClick={() => setCurrentPage(page as number)}
                                        >
                                            {page}
                                        </Button>
                                    )
                                ))}
                            </div>
                            
                            <Button
                                color="gray"
                                variant="soft"
                                size="2"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                                <ChevronRightIcon />
                            </Button>
                        </div>
                    </div>
                )}

                <ViewOrderDialog
                    open={showViewDialog}
                    onOpenChange={(openState) => {
                        setShowViewDialog(openState);
                        if (!openState) {
                            setSelectedOrder(null);
                        }
                    }}
                    orderId={selectedOrder}
                />

                {/* <UpdateOrderDialog 
                    open={showUpdateDialog}
                    onOpenChange={(openState) => {
                        setShowUpdateDialog(openState);
                        if (!openState) {
                            setSelectedOrder(null);
                        }
                    }}
                    orderId={selectedOrder}
                    onUpdateSuccess={handleUpdateSuccess}
                /> */}
            </Theme>
        </div>
    )
}