'use client';
import { useState } from 'react';
import { Theme, Button, Flex, Callout } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import AddItemDialog from '../../components/AddItemDialog';
import PaymentDialog from '../../components/PaymentDialog';
import { CartItem } from '@/app/types/pos';
import { processOrder } from '@/app/utils/orderProcessor';

export default function POSPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const addItems = (newItems: CartItem[]) => {
    // Handle array of items (both dialogs now pass arrays)
    setItems(prev => [...prev, ...newItems]);
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const total = items.reduce((acc, item) => acc + item.price, 0);

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handlePaymentComplete = async (paymentMethod: 'cash' | 'card', referenceNumber?: number) => {
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await processOrder(items, paymentMethod, referenceNumber);

      if (result.success) {
        setSuccessMessage(`Order ${result.orderNumber} processed successfully! PDFs have been generated.`);
        // Clear cart
        setItems([]);
        // Close payment dialog after a short delay
        setTimeout(() => {
          setShowPaymentDialog(false);
        }, 1500);
      } else {
        setErrorMessage(result.error || 'Payment processing failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-10 px-12">
      <Theme className="inline">
        <h1 className="text-2xl font-bold mb-4 font-inter">Point Of Sales (POS)</h1>

        {/* Success/Error Messages */}
        {successMessage && (
          <Callout.Root color="green" className="mb-4">
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}
        {errorMessage && (
          <Callout.Root color="red" className="mb-4">
            <Callout.Text>{errorMessage}</Callout.Text>
          </Callout.Root>
        )}

        <div className="bg-white rounded-lg shadow-md p-4">
          <table className="min-w-full bg-white shadow-md rounded-lg border-collapse border overflow-hidden font-inter">
            <thead className="bg-signature-red text-white">
              <tr>
                <th className="py-3 px-6 text-left">No</th>
                <th className="py-3 px-6 text-left">Item</th>
                <th className="py-3 px-6 text-left">Quantity</th>
                <th className="py-3 px-6 text-left">Price (RM)</th>
                <th className="py-3 px-6 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item, i) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-6">{i + 1}</td>
                    <td className="py-3 px-6">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.type === 'ticket' && item.showtime && (
                          <div className="text-xs text-gray-500">
                            {item.showtime.date} • {formatTime(item.showtime.time)}
                            {item.seats && item.seats.length > 0 && ` • Seats: ${item.seats.join(', ')}`}
                          </div>
                        )}
                        {item.type === 'fnb' && item.fnbType && (
                          <div className="text-xs text-gray-500">{item.fnbType}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6">{item.quantity}</td>
                    <td className="py-3 px-6">RM {item.price.toFixed(2)}</td>
                    <td className="py-3 px-6">
                      <Button color="red" variant="solid" onClick={() => removeItem(item.id)}>
                        <TrashIcon /> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <Button color="green" variant="solid" onClick={() => setShowAddDialog(true)}>
              <PlusIcon /> Add Item
            </Button>

            <div className="flex items-end gap-4">
              <p className="text-lg font-bold">Total: RM {total.toFixed(2)}</p>
              <Button 
                color="indigo" 
                variant="solid" 
                disabled={items.length === 0 || isProcessing}
                onClick={() => setShowPaymentDialog(true)}
              >
                Proceed to Payment
              </Button>
            </div>
            
          </div>
        </div>

        {/* Add Item Dialog */}
        <AddItemDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAddItem={addItems} />

        {/* Payment Dialog */}
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          items={items}
          total={total}
          onPaymentComplete={handlePaymentComplete}
        />
      </Theme>
    </div>
  );
}