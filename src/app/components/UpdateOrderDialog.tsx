'use client'
import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '@/app/lib/supabaseClient';
import { X } from 'lucide-react';
import { Theme, Spinner, Button } from '@radix-ui/themes';

interface UpdateOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
    onUpdateSuccess?: () => void;
}

export default function UpdateOrderDialog({ open, onOpenChange, orderId, onUpdateSuccess } : UpdateOrderDialogProps) {
    const [orderStatus, setOrderStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!orderId) {
                setOrderStatus('');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const {data, error: fetchError} = await supabase
                .from('order')
                .select('status')
                .eq('order_id', orderId)
                .single();

            if (fetchError) {
                console.error("Error fetching order status:", fetchError);
                setError("Failed to load order status");
            } else {
                setOrderStatus(data?.status || '');
            }
            
            setLoading(false);
        }
        
        if (open && orderId) {
            fetchStatus();
        }
    }, [orderId, open])

    const handleUpdate = async () => {
        if(!orderStatus || !orderId) {
            return;
        }

        setUpdating(true);
        setError(null);

        const { error: updateError } = await supabase
            .from("order")
            .update({
                status: orderStatus
            })
            .eq("order_id", orderId);
        
        if (updateError) {
            console.error("Error updating status:", updateError);
            setError("Failed to update order status. Please try again.");
            setUpdating(false);
        } else {
            // Close dialog and refresh the orders list
            onOpenChange(false);
            if (onUpdateSuccess) {
                onUpdateSuccess();
            }
        }
    }

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
                        <Dialog.Title className="text-xl font-bold mb-4 font-inter">Update Order Status</Dialog.Title>
                        <Theme className='inline'>
                            {loading ? (
                                <div className='flex flex-row items-center gap-2 font-inter'>
                                    <Spinner size="3" />
                                    <p className="text-gray-500">Loading order status...</p>
                                </div>
                            ) : (
                                <div className='flex flex-col gap-4 font-inter'>
                                    {error && (
                                        <p className="text-red-500 text-sm">{error}</p>
                                    )}
                                    <div className='flex flex-col gap-2'>
                                        <label className="font-medium">Order Status</label>
                                        <select 
                                            className="border border-gray-300 p-2 rounded-md"
                                            value={orderStatus} 
                                            onChange={(e) => setOrderStatus(e.target.value)}
                                            disabled={updating}
                                        >
                                            <option value="">Select status</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Ready For Pickup">Ready For Pickup</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className='flex justify-end gap-2'>
                                        <Button
                                            color='gray'
                                            variant='soft'
                                            onClick={() => onOpenChange(false)}
                                            disabled={updating}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            color='green'
                                            variant='solid'
                                            onClick={handleUpdate}
                                            disabled={updating || !orderStatus}
                                        >
                                            {updating ? (
                                                <>
                                                    <Spinner size="2" />
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update Status'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Theme>
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog.Root>
    )   
}