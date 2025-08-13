import React, { useCallback, useRef, useState } from 'react';
import { BoardItemData, ItemType } from '../types';
import StickyNote from './StickyNote';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';
import EmojiItem from './EmojiItem';
import { PIN_URL } from '../constants';

interface BoardItemProps {
  item: BoardItemData;
  onUpdate: (id: string, updates: Partial<BoardItemData>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string, isShiftPressed: boolean) => void;
  isSelected: boolean;
  scale: number;
  onBringForward: () => void;
  onSendBackward: () => void;
  onTransientUpdate: (update: BoardItemData | null) => void;
}

const ControlHandle: React.FC<{ onPointerDown: (e: React.PointerEvent) => void; cursor: string; position: string; title?: string; children: React.ReactNode; className?: string }> = ({ onPointerDown, cursor, position, title, children, className = '' }) => (
  <div
    onPointerDown={onPointerDown}
    className={`absolute ${position} w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md transform z-10 ${className}`}
    style={{ cursor }}
    title={title}
  >
    {children}
  </div>
);

const BoardItem: React.FC<BoardItemProps> = ({ item, onUpdate, onDelete, onSelect, isSelected, scale, onBringForward, onSendBackward, onTransientUpdate }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [transientItem, setTransientItem] = useState<BoardItemData | null>(null);
  const displayedItem = transientItem || item;
  
  const handleInteractionStart = useCallback((
    e: React.PointerEvent,
    interactionType: 'drag' | 'resize' | 'rotate'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(item.id, e.shiftKey);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialItemState = item; 
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const newTransientData = { ...initialItemState };

      if (interactionType === 'drag') {
        newTransientData.x = initialItemState.x + dx / scale;
        newTransientData.y = initialItemState.y + dy / scale;
      } else if (interactionType === 'resize') {
        newTransientData.width = Math.max(50, initialItemState.width + dx / scale);
        newTransientData.height = Math.max(50, initialItemState.height + dy / scale);
      } else if (interactionType === 'rotate' && itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
        const moveAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
        newTransientData.rotation = initialItemState.rotation + (moveAngle - startAngle);
      }
      setTransientItem(newTransientData);
      onTransientUpdate(newTransientData);
    };
    
    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      
      onTransientUpdate(null);

      setTransientItem(currentTransientItem => {
        if (currentTransientItem) {
          const hasChanged = JSON.stringify(currentTransientItem) !== JSON.stringify(initialItemState);
          if (hasChanged) {
            onUpdate(item.id, { 
              x: currentTransientItem.x,
              y: currentTransientItem.y,
              width: currentTransientItem.width,
              height: currentTransientItem.height,
              rotation: currentTransientItem.rotation
            });
          }
        }
        return null; 
      });
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [item, onUpdate, onSelect, scale, onTransientUpdate]);

  const renderContent = () => {
    const currentItem = transientItem || item;
    switch (currentItem.type) {
      case ItemType.Note:
        return <StickyNote item={currentItem} onUpdate={onUpdate} isSelected={isSelected} />;
      case ItemType.Image:
        return <ImageItem item={currentItem} />;
      case ItemType.Video:
        return <VideoItem item={currentItem} isSelected={isSelected} />;
      case ItemType.Emoji:
        return <EmojiItem item={currentItem} />;
      default:
        return null;
    }
  };

  const isPngImage = displayedItem.type === ItemType.Image && displayedItem.content.startsWith('data:image/png;');
  const showContainerShadow = displayedItem.type !== ItemType.Emoji && !isPngImage;

  return (
    <div
      ref={itemRef}
      data-item-id={item.id}
      className={`absolute transition-shadow duration-200 board-item-container ${isSelected ? 'board-item-selected' : ''}`}
      style={{
        left: displayedItem.x,
        top: displayedItem.y,
        width: displayedItem.width,
        height: displayedItem.height,
        transform: `rotate(${displayedItem.rotation}deg)`,
        zIndex: displayedItem.zIndex,
      }}
      onPointerDown={(e) => {
        if (item.type === ItemType.Video) {
          if (!isSelected) onSelect(item.id, e.shiftKey);
          return;
        }
        if ((e.target as HTMLElement).closest('textarea, button, a, iframe, .absolute.w-6.h-6')) return;
        handleInteractionStart(e, 'drag');
      }}
    >
      <div className={`w-full h-full cursor-grab active:cursor-grabbing rounded-lg overflow-hidden ${showContainerShadow ? 'strong-shadow' : ''}`}>
        {renderContent()}
      </div>
      
      {displayedItem.type === ItemType.Note && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-20 w-40 h-40 z-10 rotate-[-15deg]" style={{ backgroundImage: `url(${PIN_URL})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} />}

      {isSelected && (
        <>
          <ControlHandle onPointerDown={(e) => { e.stopPropagation(); onDelete(item.id); }} cursor="pointer" position="top-0 right-0 translate-x-1/2 -translate-y-1/2" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </ControlHandle>
          <ControlHandle onPointerDown={(e) => handleInteractionStart(e, 'resize')} cursor="se-resize" position="bottom-0 right-0 translate-x-1/2 translate-y-1/2" title="Resize">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-45" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          </ControlHandle>
          <ControlHandle onPointerDown={(e) => handleInteractionStart(e, 'rotate')} cursor="crosshair" position="top-0 left-0 -translate-x-1/2 -translate-y-1/2" title="Rotate">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
          </ControlHandle>
          <ControlHandle onPointerDown={(e) => handleInteractionStart(e, 'drag')} cursor="move" position="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" title="Move">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v2.586l3.293-3.293a1 1 0 111.414 1.414L12.414 8H15a1 1 0 110 2h-2.586l3.293 3.293a1 1 0 11-1.414 1.414L11 12.414V15a1 1 0 11-2 0v-2.586l-3.293 3.293a1 1 0 11-1.414-1.414L7.586 12H5a1 1 0 110-2h2.586L4.293 6.707a1 1 0 011.414-1.414L9 8.586V6a1 1 0 011-1z" /></svg>
          </ControlHandle>
          <ControlHandle onPointerDown={onBringForward} cursor="pointer" position="top-1/4 left-0 -translate-x-1/2 -translate-y-1/2" title="Bring Forward">🔼</ControlHandle>
          <ControlHandle onPointerDown={onSendBackward} cursor="pointer" position="top-3/4 left-0 -translate-x-1/2 -translate-y-1/2" title="Send Backward">🔽</ControlHandle>
        </>
      )}
    </div>
  );
};
export default BoardItem;