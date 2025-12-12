'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Theme, Button, Flex } from '@radix-ui/themes';
import { X, Ticket, Utensils } from 'lucide-react';
import { useState } from 'react';
import SelectTicketDialog from './SelectTicketDialog';
import SelectFNBDialog from './SelectFNBDialog';
import { CartItem } from '@/app/types/pos';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (items: CartItem[]) => void;
}

export default function AddItemDialog({ open, onOpenChange, onAddItem }: AddItemDialogProps) {
  const [type, setType] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setType(null); // Clear type when dialog closes
    }
    onOpenChange(isOpen);
  };

  const handleAddItem = (items: CartItem[]) => {
    onAddItem(items);
    // Close dialog after adding items
    setType(null);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* Overlay centered with Flexbox */}
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-[100] flex items-center justify-center p-4">
          <Dialog.Content className="bg-white rounded-lg shadow-xl md:min-w-md relative z-[101] max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Close Button (X) */}
            <Dialog.Close asChild>
              <button
                onClick={() => setType(null)} // Also clear type manually if closed
                className="absolute top-3 right-3 text-gray-500 hover:text-black transition z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>

            {/* Dialog Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {!type ? (
                <>
                  <Dialog.Title className="text-xl font-bold mb-4 text-center">
                    Select Item Type
                  </Dialog.Title>

                  <Theme className="inline w-full">
                    <Flex justify="center" gap="3">
                      <Button color="amber" onClick={() => setType('ticket')}>
                        <Ticket />
                        Ticket
                      </Button>
                      <Button color="blue" onClick={() => setType('fnb')}>
                        <Utensils />
                        F&B
                      </Button>
                    </Flex>
                  </Theme>
                </>
              ) : type === 'ticket' ? (
                <SelectTicketDialog onBack={() => setType(null)} onAddItem={handleAddItem} />
              ) : (
                <SelectFNBDialog onBack={() => setType(null)} onAddItem={handleAddItem} />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}