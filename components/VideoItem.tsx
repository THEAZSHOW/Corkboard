import React from 'react';
import { BoardItemData } from '../types';

interface VideoItemProps {
  item: BoardItemData;
  isSelected: boolean;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

const VideoItem: React.FC<VideoItemProps> = ({ item, isSelected }) => {
  const embedUrl = getYouTubeEmbedUrl(item.content);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center text-white">
      {embedUrl ? (
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ pointerEvents: isSelected ? 'auto' : 'none' }}
        ></iframe>
      ) : (
        <p className="p-4 text-center text-red-400">Invalid YouTube URL</p>
      )}
    </div>
  );
};

export default VideoItem;
