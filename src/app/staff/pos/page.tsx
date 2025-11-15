'use client';
import { useState } from 'react';
import { Theme, Button, Flex } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import AddItemDialog from '../../components/AddItemDialog';

export default function POSPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const addItem = (item: any) => {
    setItems(prev => [...prev, item]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="py-10 px-12">
      <Theme className="inline">
        <h1 className="text-2xl font-bold mb-4 font-inter">Point Of Sales (POS)</h1>

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
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-6">{i + 1}</td>
                    <td className="py-3 px-6">{item.name}</td>
                    <td className="py-3 px-6">{item.quantity}</td>
                    <td className="py-3 px-6">{item.price.toFixed(2)}</td>
                    <td className="py-3 px-6">
                      <Button color="red" variant="solid" onClick={() => removeItem(i)}>
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
              <Button color="indigo" variant="solid" disabled={items.length === 0}>
                Proceed to Payment
              </Button>
            </div>
            
          </div>
        </div>

        {/* Add Item Dialog */}
        <AddItemDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAddItem={addItem} />
      </Theme>
    </div>
  );
}