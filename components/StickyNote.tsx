
import React from 'react';
import { BoardItemData } from '../types';
import { FONT_SIZE_MIN, FONT_SIZE_DEFAULT } from '../constants';

interface StickyNoteProps {
  item: BoardItemData;
  onUpdate: (id: string, updates: Partial<BoardItemData>) => void;
  isSelected: boolean;
}

const FontSizeButton: React.FC<{ onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="w-8 h-8 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full text-sm font-bold text-gray-700"
        onPointerDown={e => e.stopPropagation()}
    >
        {children}
    </button>
);

const StickyNote: React.FC<StickyNoteProps> = ({ item, onUpdate, isSelected }) => {
  const currentFontSize = item.fontSize || FONT_SIZE_DEFAULT;

  const changeFontSize = (direction: 'increase' | 'decrease') => {
    const newSize = direction === 'increase' 
      ? currentFontSize + 2
      : Math.max(FONT_SIZE_MIN, currentFontSize - 2);
    onUpdate(item.id, { fontSize: newSize });
  };
  
  return (
    <div className={`w-full h-full p-6 pt-20 relative ${item.color || 'bg-yellow-200'}`}>
      {isSelected && (
        <div className="absolute top-4 right-4 flex space-x-2 z-20">
            <FontSizeButton onClick={() => changeFontSize('decrease')}>A-</FontSizeButton>
            <FontSizeButton onClick={() => changeFontSize('increase')}>A+</FontSizeButton>
        </div>
      )}
      <textarea
        className="w-full h-full bg-transparent border-none resize-none focus:outline-none sticky-note-font text-gray-800"
        style={{ fontSize: `${currentFontSize}px`, lineHeight: 1.5 }}
        value={item.content}
        onChange={(e) => onUpdate(item.id, { content: e.target.value })}
        placeholder="Write something..."
      />
    </div>
  );
};

export default StickyNote;