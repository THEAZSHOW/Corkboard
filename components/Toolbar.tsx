
import React from 'react';
import { ItemType } from '../types';
import { ZOOM_MIN, ZOOM_MAX } from '../constants';

interface ToolbarProps {
  onAddItem: (type: ItemType) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onThemeChange: () => void;
  onBackup: () => void;
  onLoad: () => void;
  boardName: string;
}

const ToolbarButton: React.FC<{ onClick: () => void; title: string; disabled?: boolean; children: React.ReactNode }> = ({ onClick, title, disabled = false, children }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-2xl transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/20 disabled:transform-none"
  >
    {children}
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddItem, zoomLevel, onZoomChange, onUndo, onRedo, canUndo, canRedo,
  onThemeChange, onBackup, onLoad, boardName
}) => {
  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-black/30 backdrop-blur-md p-2 rounded-full shadow-lg flex items-center space-x-2 text-white">
      <ToolbarButton onClick={() => onAddItem(ItemType.Note)} title="Add Sticky Note">📝</ToolbarButton>
      <ToolbarButton onClick={() => onAddItem(ItemType.Image)} title="Upload Image">🖼️</ToolbarButton>
      <ToolbarButton onClick={() => onAddItem(ItemType.Video)} title="Add YouTube Video">▶️</ToolbarButton>
      <ToolbarButton onClick={() => onAddItem(ItemType.Emoji)} title="Add Emoji">😀</ToolbarButton>
      
      <div className="w-px h-8 bg-white/30 mx-2"></div>

      <ToolbarButton onClick={onUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}>↩️</ToolbarButton>
      <ToolbarButton onClick={onRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}>↪️</ToolbarButton>

      <div className="w-px h-8 bg-white/30 mx-2"></div>
      
      <ToolbarButton onClick={onThemeChange} title="Change Theme">🎨</ToolbarButton>
      <ToolbarButton onClick={onBackup} title="Backup Board">💾</ToolbarButton>
      <ToolbarButton onClick={onLoad} title="Load Board">📂</ToolbarButton>
      
      <div className="w-px h-8 bg-white/30 mx-2"></div>
      
      <span className="px-3 py-2 text-sm font-semibold whitespace-nowrap">{boardName}</span>
      
      <div className="w-px h-8 bg-white/30 mx-2"></div>

      <div className="flex items-center space-x-2 px-2">
        <button onClick={() => onZoomChange(Math.max(ZOOM_MIN, zoomLevel - 0.2))} className="text-2xl hover:text-blue-300 transition-colors">-</button>
        <span className="text-sm font-medium w-16 text-center tabular-nums">{(zoomLevel * 100).toFixed(0)}%</span>
        <button onClick={() => onZoomChange(Math.min(ZOOM_MAX, zoomLevel + 0.2))} className="text-2xl hover:text-blue-300 transition-colors">+</button>
      </div>
    </div>
  );
};

export default Toolbar;
