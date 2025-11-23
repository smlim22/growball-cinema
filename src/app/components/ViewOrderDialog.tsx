'use client'
import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '@/app/lib/supabaseClient';
import { X } from 'lucide-react';
import { Theme, Spinner } from '@radix-ui/themes';

interface ViewOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
}

type OrderList = {
    order_list_id: number;
    order_id: number;
    fnb_id: number;
    quantity: number;
    price: number;
    fnb: {
        fnb_id: number;
        fnb_name: string | null;
    } | null;
}

export default function ViewOrderDialog({ open, onOpenChange, orderId }: ViewOrderDialogProps) {
    const [orderList, setOrderList] = useState<OrderList[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setOrderList([]);
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('order_list')
                .select('*, fnb (fnb_name, price)')
                .eq('order_id', orderId)

            if (error) {
                console.error('Error fetching order:', error);
            } else {
                console.log(orderList)
                setOrderList(data || []);
            }

            setLoading(false);
        };
        fetchOrder();
    }, [orderId]);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-black/50 fixed inset-0 z-[100] flex items-center justify-center">
                    <Dialog.Content className="bg-white rounded-lg p-6 shadow-xl md:min-w-md relative z-[101]">
                        <Dialog.Close asChild>
                            <button className="absolute top-3 right-3 text-gray-500 hover:text-black transition">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                        <Dialog.Title className="text-xl font-bold mb-4 font-inter">Order Details</Dialog.Title>
                        <Theme className='inline'>
                            <div className="flex font-inter">
                                {loading ? (
                                    <div className='flex flex-row items-center gap-2'>
                                        <Spinner size="3" />
                                        <p className="text-gray-500">Loading orders...</p>
                                    </div>
                                ) : orderList.length === 0 ? (
                                    <p className="text-center text-gray-500">No items found for this order.</p>
                                ) : (
                                    <table className='min-w-full'>
                                        <thead>
                                            <tr className='border-b border-gray-500'>
                                                <th className='p-2 text-start'>No.</th>
                                                <th className='p-2 text-start'>Item</th>
                                                <th className='p-2 text-start'>Quantity</th>
                                                <th className='p-2 text-start'>Price (RM)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderList.length > 0 ? (
                                                orderList.map((order, index) => (
                                                    <tr key={order.order_list_id}>
                                                        <td className='p-2'>{index + 1}</td>
                                                        <td className='p-2'>{order.fnb?.fnb_name ?? 'Unknown item'}</td>
                                                        <td className='p-2'>{order.quantity}</td>
                                                        <td className='p-2'>{order.price.toFixed(2)}</td>
                                                    </tr>
                                                ))
                                                ) : (
                                                    <tr>
                                                        <td className='p-2' colSpan={4}>No items found</td>
                                                    </tr>
                                                )
                                            }
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </Theme>
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog.Root>
    )
}