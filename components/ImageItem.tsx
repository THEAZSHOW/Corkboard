import React from 'react';
import { BoardItemData } from '../types';

interface ImageItemProps {
  item: BoardItemData;
}

const ImageItem: React.FC<ImageItemProps> = ({ item }) => {
  const isPng = item.content.startsWith('data:image/png;');

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <img
        src={item.content}
        alt="User content"
        className="w-full h-full object-contain"
        style={isPng ? { filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.25))' } : {}}
        draggable={false}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://i.imgur.com/80idhS4.png';
          (e.target as HTMLImageElement).alt = 'Error loading image';
        }}
      />
    </div>
  );
};

export default ImageItem;