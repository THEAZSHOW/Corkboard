import React, { useEffect, useRef } from 'react';

// Tell TypeScript that EmojiMart will be on the window object
declare global {
  interface Window {
    EmojiMart: any;
  }
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: { native: string }) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerInstance = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        // Close if the click is outside the picker component
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
            onClose();
        }
    };
    document.addEventListener('mousedown', handleClickOutside);

    if (pickerRef.current && !pickerInstance.current) {
        pickerInstance.current = new window.EmojiMart.Picker({
            onEmojiSelect: onEmojiSelect,
            previewPosition: 'none',
        });
        pickerRef.current.appendChild(pickerInstance.current);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onEmojiSelect, onClose]);

  return (
    <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center z-[1000] pt-24"
        onPointerDown={(e) => {
            // This stops clicks on the backdrop from deselecting items on the board.
            e.stopPropagation();
        }}
    >
      <div 
        ref={pickerRef}
        // This stops clicks inside the picker from bubbling up to the backdrop's close handler.
        onPointerDown={(e) => e.stopPropagation()} 
      />
    </div>
  );
};

export default EmojiPicker;
