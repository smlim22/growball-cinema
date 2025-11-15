'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Theme, Button, TextField, Flex, RadioGroup, Text } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useState } from 'react';
import { CartItem } from '@/app/types/pos';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  total: number;
  onPaymentComplete: (paymentMethod: 'cash' | 'card', referenceNumber?: number) => Promise<void>;
}

export default function PaymentDialog({ open, onOpenChange, items, total, onPaymentComplete }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when closing
      setPaymentMethod('cash');
      setReferenceNumber('');
      setCashAmount('');
      setError('');
    }
    onOpenChange(isOpen);
  };

  const calculateChange = () => {
    if (!cashAmount || isNaN(parseFloat(cashAmount))) return 0;
    const paid = parseFloat(cashAmount);
    return paid - total;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (paymentMethod === 'card') {
      if (!referenceNumber.trim()) {
        setError('Please enter a reference number for card payment.');
        return;
      }
      // Validate that reference number is a valid integer
      const refNum = parseInt(referenceNumber.trim(), 10);
      if (isNaN(refNum) || refNum <= 0) {
        setError('Please enter a valid reference number (positive integer).');
        return;
      }
    } else {
      // Cash payment
      if (!cashAmount || isNaN(parseFloat(cashAmount))) {
        setError('Please enter the cash amount received.');
        return;
      }
      const change = calculateChange();
      if (change < 0) {
        setError(`Insufficient payment. Please enter at least RM ${total.toFixed(2)}.`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const refNum = paymentMethod === 'card' ? parseInt(referenceNumber.trim(), 10) : undefined;
      await onPaymentComplete(paymentMethod, refNum);
      handleOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const change = calculateChange();

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-[100] flex items-center justify-center">
          <Dialog.Content className="bg-white rounded-lg p-6 shadow-xl md:min-w-md max-w-md w-full relative z-[101] max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <Dialog.Close asChild>
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>

            <Dialog.Title className="text-xl font-bold mb-4 text-center">
              Payment
            </Dialog.Title>

            <div className="mb-4">
              <Text className="text-lg font-semibold">Total Amount: RM {total.toFixed(2)}</Text>
            </div>

            <Theme>
              <div className="space-y-4">
                {/* Payment Method Selection */}
                <div>
                  <Text className="text-sm font-medium mb-2 block">Payment Method</Text>
                  <RadioGroup.Root
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card')}
                  >
                    <Flex direction="column" gap="2">
                      <Text as="label" size="2">
                        <Flex align="center" gap="2">
                          <RadioGroup.Item value="cash" />
                          Cash
                        </Flex>
                      </Text>
                      <Text as="label" size="2">
                        <Flex align="center" gap="2">
                          <RadioGroup.Item value="card" />
                          Card
                        </Flex>
                      </Text>
                    </Flex>
                  </RadioGroup.Root>
                </div>

                {/* Cash Payment Fields */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-2">
                    <Text className="text-sm font-medium">Cash Received</Text>
                    <TextField.Root
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                    />
                    {change >= 0 && (
                      <div className="text-green-600 font-semibold">
                        Change: RM {change.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Payment Fields */}
                {paymentMethod === 'card' && (
                  <div className="space-y-2">
                    <Text className="text-sm font-medium">Reference Number</Text>
                    <TextField.Root
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter card transaction reference"
                      value={referenceNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow positive integers
                        if (value === '' || /^\d+$/.test(value)) {
                          setReferenceNumber(value);
                        }
                      }}
                    />
                  </div>
                )}

                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                <Flex gap="3" justify="end" className="mt-6">
                  <Button
                    variant="soft"
                    onClick={() => handleOpenChange(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="green"
                    onClick={handleSubmit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Complete Payment'}
                  </Button>
                </Flex>
              </div>
            </Theme>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

