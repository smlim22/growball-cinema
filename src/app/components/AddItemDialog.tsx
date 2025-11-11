'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Theme, Button, Flex } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useState } from 'react';
import SelectTicketDialog from './SelectTicketDialog';
import SelectFNBDialog from './SelectFNBDialog';

export default function AddItemDialog({ open, onOpenChange, onAddItem }: any) {
  const [type, setType] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setType(null); // Clear type when dialog closes
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* Overlay centered with Flexbox */}
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-[100] flex items-center justify-center">
          <Dialog.Content className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md relative z-[101]">
            
            {/* Close Button (X) */}
            <Dialog.Close asChild>
              <button
                onClick={() => setType(null)} // Also clear type manually if closed
                className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>

            {/* Dialog Content */}
            {!type ? (
              <>
                <Dialog.Title className="text-xl font-bold mb-4 text-center">
                  Select Item Type
                </Dialog.Title>

                <Theme className="inline w-full">
                  <Flex justify="center" gap="3">
                    <Button color="green" onClick={() => setType('ticket')}>
                      🎬 Ticket
                    </Button>
                    <Button color="blue" onClick={() => setType('fnb')}>
                      🍿 F&B
                    </Button>
                  </Flex>
                </Theme>
              </>
            ) : type === 'ticket' ? (
              <SelectTicketDialog onBack={() => setType(null)} onAddItem={onAddItem} />
            ) : (
              <SelectFNBDialog onBack={() => setType(null)} onAddItem={onAddItem} />
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}