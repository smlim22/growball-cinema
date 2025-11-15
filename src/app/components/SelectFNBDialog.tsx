'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Button, Theme } from '@radix-ui/themes';
import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { CartItem, FnbItem } from '@/app/types/pos';

interface SelectFNBDialogProps {
  onBack: () => void;
  onAddItem: (items: CartItem[]) => void;
}

export default function SelectFNBDialog({ onBack, onAddItem }: SelectFNBDialogProps) {
  const [fnbItems, setFnbItems] = useState<FnbItem[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    supabase
      .from('fnb')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching F&B items:', error);
          return;
        }
        setFnbItems(data || []);
        // initialize quantities
        const initial: { [key: string]: number } = {};
        data?.forEach((item: FnbItem) => (initial[item.fnb_id.toString()] = 0));
        setQuantities(initial);
      });
  }, []);

  const increase = (id: string) => {
    setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }));
  };

  const decrease = (id: string) => {
    setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));
  };

  const handleAddSelected = () => {
    const selected: CartItem[] = fnbItems
      .filter(item => quantities[item.fnb_id.toString()] > 0)
      .map(item => {
        const quantity = quantities[item.fnb_id.toString()];
        const totalPrice = item.price * quantity;
        
        // Generate unique ID for each cart item
        const itemId = `fnb-${item.fnb_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          id: itemId,
          type: 'fnb' as const,
          name: item.fnb_name,
          quantity: quantity,
          price: totalPrice, // Total price for this quantity
          unitPrice: item.price, // Price per unit
          fnbId: item.fnb_id,
          fnbType: item.type,
        };
      });

    if (selected.length > 0) {
      onAddItem(selected);
      // Dialog will be closed by parent AddItemDialog
    }
  };

  return (
    <div>
      <a
        onClick={onBack}
        className="cursor-pointer flex gap-1 items-center hover:underline mb-3"
      >
        <ArrowLeftIcon /> Back
      </a>

      <h2 className="text-lg font-bold my-3">Select F&B Items</h2>

      <ul className="space-y-2">
        {fnbItems.map(item => (
          <li
            key={item.fnb_id}
            className="p-3 border border-gray-200 rounded-md flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{item.fnb_name}</div>
              <div className="text-sm text-gray-600">RM {item.price.toFixed(2)}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="w-6 h-6 rounded-full bg-gray-300 text-black flex items-center justify-center"
                onClick={() => decrease(item.fnb_id.toString())}
              >
                -
              </button>
              <span className="w-6 text-center">{quantities[item.fnb_id.toString()] || 0}</span>
              <button
                className="w-6 h-6 rounded-full bg-gray-300 text-black flex items-center justify-center"
                onClick={() => increase(item.fnb_id.toString())}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
      
      <Theme className="flex mt-4">
        <Button
          color='green'
          onClick={handleAddSelected}
          className="mt-4 w-full"
          disabled={Object.values(quantities).every(q => q === 0)}
        >
          <PlusIcon />
          Add Selected Items
        </Button>
      </Theme>
    </div>
  );
}