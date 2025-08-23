'use client';

import { useState } from 'react';
import { Sheet } from 'react-modal-sheet';
import { Button } from './button';
import { X } from 'lucide-react';

interface ModalSheetSelectProps {
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
  placeholder: string;
  label: string;
}

export function ModalSheetSelect({
  options,
  value,
  onSelect,
  placeholder,
  label,
}: ModalSheetSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        className="w-full h-12 px-3 py-2 border border-input bg-background rounded-md flex items-center justify-between text-left font-normal cursor-pointer hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={() => setIsOpen(true)}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Modal Sheet */}
      <Sheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={[0.5]}
      >
        <Sheet.Container>
          <Sheet.Header>
            {/* Custom Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-primary">{label}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Sheet.Header>

          <Sheet.Content style={{ paddingBottom: 0 }}>
            <div
              className="px-6 py-4 space-y-2 overflow-y-auto"
              style={{ maxHeight: 'calc(50vh - 120px)' }}
            >
              {options.map((option) => (
                <Button
                  key={option}
                  variant={value === option ? 'default' : 'ghost'}
                  className="w-full h-12 justify-start text-left font-normal"
                  onClick={() => handleSelect(option)}
                >
                  {option}
                  {value === option && (
                    <svg
                      className="ml-auto h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </Button>
              ))}
            </div>
          </Sheet.Content>
        </Sheet.Container>

        <Sheet.Backdrop onTap={() => setIsOpen(false)} />
      </Sheet>
    </>
  );
}
