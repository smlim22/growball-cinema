'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Button } from '@radix-ui/themes';

export default function SelectFNBDialog({ onBack, onAddItem }: any) {
  const [fnbItems, setFnbItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('fnb').select('*').then(({ data }) => setFnbItems(data || []));
  }, []);

  return (
    <div>
      <Button onClick={onBack}>← Back</Button>
      <h2 className="text-lg font-bold mb-2 mt-2">Select F&B Item</h2>
      <div className="grid grid-cols-2 gap-3">
        {fnbItems.map(item => (
          <Button
            key={item.fnb_id}
            onClick={() => onAddItem({
              type: 'fnb',
              name: item.fnb_name,
              quantity: 1,
              price: item.price,
            })}
          >
            {item.fnb_name} (RM {item.price.toFixed(2)})
          </Button>
        ))}
      </div>
    </div>
  );
}